extern void out(const char*, int);

__attribute__((export_name("main"))) int main(int argc, char** argv) {
  out("test 666", 8);
  return 0;
}
