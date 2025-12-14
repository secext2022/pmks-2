// txt2epub.js
//
// deno run -A txt2epub.js 1.txt out1

// 计算中文字数: 非 ASCII 字符都算
function 字数(文本) {
  let 计数 = 0;
  for (const i of 文本) {
    if (i.codePointAt(0) > 127) {
      计数 += 1;
    }
  }
  return 计数;
}

// 将输入 txt 文件内容转换成内部数据格式, 并进行分章
function 解析txt(文本) {
  // 全文总字数
  const 总字 = 字数(文本);

  // 按 ## 切分章节 (markdown)
  const 部分 = 文本.split("\n## ");

  // 章节的第 1 行是标题
  const 章 = 部分.map((i) => {
    const 行 = i.split("\n");

    // 章节正文字数
    const 字 = 字数(行.slice(1).join("\n"));

    return {
      // 标题 (字数)
      标题: 行[0] + " (" + 字 + ")",
      段: 行.slice(1),
    };
  });

  // 书名为第 1 行
  // 总字数 (k 计数)
  const 总字k = (总字 / 1000).toFixed(0);
  return {
    标题: 章[0].标题 + " (" + 总字k + "k)",
    章,
  };
}

// 读取 txt 文件并解析
async function 加载txt(文件) {
  const 文本 = await Deno.readTextFile(文件);
  return 解析txt(文本);
}

// 生成 uuid
function 造uuid() {
  return crypto.randomUUID();
}

// 渲染 epub

// out/mimetype
function 渲染mimetype() {
  return `application/epub+zip`;
}

// out/META-INF/container.xml
function 渲染container_xml() {
  return `<?xml version="1.0" encoding="utf-8"?>
<container
  version="1.0"
  xmlns="urn:oasis:names:tc:opendocument:xmlns:container"
>
  <rootfiles>
    <rootfile
      full-path="OEBPS/content.opf"
      media-type="application/oebps-package+xml"
    />
  </rootfiles>
</container>
`;
}

// out/OEBPS/content.opf
function 渲染content_opf(数据) {
  const uuid = 造uuid();

  const item = 数据.章.map((_, 序号) =>
    `    <item id="item${序号}" href="xhtml/${序号}.xhtml" media-type="application/xhtml+xml" />`
  );
  const itemref = 数据.章.map((_, 序号) =>
    `    <itemref idref="item${序号}" />`
  );

  return `<?xml version="1.0" encoding="utf-8"?>
<package
  xmlns="http://www.idpf.org/2007/opf"
  version="3.0"
  unique-identifier="pub-id"
>
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${数据.标题}</dc:title>
    <dc:creator>you</dc:creator>
    <dc:identifier id="pub-id"
    >urn:uuid:${uuid}</dc:identifier>
  </metadata>

  <manifest>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />
    <item id="css" href="style.css" media-type="text/css" />

${item.join("\n")}
  </manifest>

  <spine toc="ncx">
${itemref.join("\n")}
  </spine>
</package>
`;
}

// out/OEBPS/toc.ncx
function 渲染toc_ncx(数据) {
  const uuid = 造uuid();

  const navPoint = 数据.章.map((i, 序号) =>
    `    <navPoint id="navPoint-${序号}" playOrder="${序号 + 1}">
      <navLabel><text>${i.标题}</text></navLabel>
      <content src="xhtml/${序号}.xhtml" />
    </navPoint>
`
  );

  return `<?xml version="1.0" encoding="utf-8"?>
<ncx
  xmlns="http://www.daisy.org/z3986/2005/ncx/"
  version="2005-1"
  xml:lang="zh-CN"
>
  <head>
    <meta
      name="dtb:uid"
      content="urn:uuid:${uuid}"
    />
    <meta name="dtb:depth" content="1" />
    <meta name="dtb:totalPageCount" content="${数据.章.length}" />
  </head>
  <docTitle>
    <text>${数据.标题}</text>
  </docTitle>
  <navMap>
${navPoint.join("\n")}
  </navMap>
</ncx>
`;
}

// out/OEBPS/style.css
function 渲染style_css() {
  return `body {

}
`;
}

// out/OEBPS/xhtml/0.xhtml
function 渲染xhtml(章, _序号) {
  const p = 章.段.map((i) => `    <p>${i}</p>`);

  return `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
  <head>
    <title>${章.标题}</title>
  </head>
  <body>
    <h2>${章.标题}</h2>

${p.join("\n")}

 </body>
</html>
`;
}

// 递归创建目录: mkdir -p
async function 建目录(路径) {
  console.log("目录", 路径);
  await Deno.mkdir(路径, {
    recursive: true,
  });
}

// 写文本文件
async function 写(名, 文本) {
  console.log(" ", 名);
  await Deno.writeTextFile(名, 文本);
}

// 生成 epub 文件
//
// epub 文件结构 (zip.epub):
//
// out/
// out/mimetype
// out/META-INF/
// out/META-INF/container.xml
// out/OEBPS/
// out/OEBPS/content.opf
// out/OEBPS/toc.ncx
// out/OEBPS/style.css
// out/OEBPS/xhtml/
// out/OEBPS/xhtml/0.xhtml
async function 造epub(数据, 输出目录) {
  // epub 元数据
  await 建目录(输出目录);
  await 写(输出目录 + "/mimetype", 渲染mimetype());

  await 建目录(输出目录 + "/META-INF");
  await 写(输出目录 + "/META-INF/container.xml", 渲染container_xml());

  await 建目录(输出目录 + "/OEBPS/xhtml");
  await 写(输出目录 + "/OEBPS/content.opf", 渲染content_opf(数据));
  await 写(输出目录 + "/OEBPS/toc.ncx", 渲染toc_ncx(数据));
  await 写(输出目录 + "/OEBPS/style.css", 渲染style_css());

  // 生成每一章
  for (let [序号, 章] of 数据.章.entries()) {
    await 写(
      输出目录 + "/OEBPS/xhtml/" + 序号 + ".xhtml",
      渲染xhtml(章, 序号),
    );
  }

  console.log("完成");
}

// 开始执行
const [输入文件, 输出目录] = Deno.args;

console.log("读", 输入文件);

const 数据 = await 加载txt(输入文件);
//console.log("data", 数据);

await 造epub(数据, 输出目录);

// txt2epub.js
