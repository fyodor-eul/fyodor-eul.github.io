title: Making you own `chroot` Environment (on Arch Linux)
image: images/chrootSetup/diagram.png
description: A guide to a basic setup of a `chroot` environment
cover: images/chrootSetup/diagram.png

## Adding libraries for `bash`
locate and verify the binary
```bash
$ which bash
/usr/bin/bash
$ file /usr/bin/bash
/usr/bin/bash: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=ecb3ca1e4e099c80e279256314985dbe33e99a2a, for GNU/Linux 4.4.0, stripped
```
list the required libraries
```bash
$ ldd /usr/bin/bash
	linux-vdso.so.1 (0x00007f4d00ece000)
	libreadline.so.8 => /usr/lib/libreadline.so.8 (0x00007f4d00d0a000)
	libc.so.6 => /usr/lib/libc.so.6 (0x00007f4d00a00000)
	libncursesw.so.6 => /usr/lib/libncursesw.so.6 (0x00007f4d00c99000)
	/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f4d00ed0000)
```


## Adding libraries for `ls`

locate and verify the binary
```bash
$ which ls
/usr/bin/ls
$ file /usr/bin/ls
/usr/bin/ls: ELF 64-bit LSB pie executable, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=4e297d3b427342e1da6b66f5ca0fd279f43f3afe, for GNU/Linux 4.4.0, stripped
```
list the required libraries
```bash
$ ldd /usr/bin/ls
	linux-vdso.so.1 (0x00007f6a8a692000)
	libcap.so.2 => /usr/lib/libcap.so.2 (0x00007f6a8a627000)
	libc.so.6 => /usr/lib/libc.so.6 (0x00007f6a8a400000)
	/lib64/ld-linux-x86-64.so.2 => /usr/lib64/ld-linux-x86-64.so.2 (0x00007f6a8a694000)
```


```bash
[fyodor@segfault:chroottryout] $ tree
.
├── bin
│   ├── bash
│   └── ls
├── etc
│   └── bash.bashrc
├── lib -> usr/lib
├── lib64
│   └── ld-linux-x86-64.so.2
└── usr
    └── lib
        ├── libcap.so.2
        ├── libc.so.6
        ├── libncursesw.so.6
        └── libreadline.so.8

7 directories, 8 files
[fyodor@segfault:chroottryout] $
```


Add symbolic link `lib` -> `usr/lib`

```bash
ln -s usr/lib lib
```
