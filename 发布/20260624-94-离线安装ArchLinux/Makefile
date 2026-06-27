# local-arch-repo_20260614.iso

iso:
	mkdir -p repo
	- rm -r repo/sync
	- rm -r repo/pkg

	cp -r /var/lib/pacman/sync repo/sync
	cp -r /var/cache/pacman/pkg repo/pkg

	mkdir -p repo/bin
	cp /usr/bin/miniserve repo/bin

	du -ab repo > du.txt
	mv du.txt repo

	- rm repo/sha256.txt
	find repo -type f -print0 | xargs -0 sha256sum > sha256.txt
	mv sha256.txt repo

	mkdir -p tar-20260614
	- rm tar-20260614/*.tar.*
	tar -cvf - repo | split --bytes=4095MiB - tar-20260614/local-arch-repo.tar.

	cp extract.sh tar-20260614

	- rm local-arch-repo_20260614.iso
	xorrisofs -V "LOCAL_ARCH_REPO_20260614_1" -J -o local-arch-repo_20260614.iso tar-20260614

.PHONY: iso
