title: Making you own chroot Environment
image: images/chrootSetup/diagram.png
description: A guide to a basic setup of a `chroot` environment
cover: images/chrootSetup/diagram.png

# Introduction
We all know that each of the running processes has its own set of permissions when accessing the filesystem. Even so, they generally share the same filesystem hierarchy.
```bash
/
├── bin/
├── etc/
├── home/
├── usr/
├── var/
├── tmp/
└── ...
```
What if we want a process to see the filesystem root differently?
We can achieve this by setting a certain directory on our system to appear as the root directory of a certain process, and the tool that allows us to do this is called **chroot**.
> The [***chroot(1)***](https://man7.org/linux/man-pages/man1/chroot.1.html) is a command-line utility that uses [***chroot(2)***](https://man7.org/linux/man-pages/man2/chroot.2.html) systemcall to the change the process's root directory.

For example, if we chrooted a process to `/opt/myroot`, `/opt/myroot` on the host will appear as `/` to that process. However, `/opt/myroot` remains `/opt/myroot` for other processes.

```bash
# Host and other processes
/
├── bin/
├── etc/
├── home/
├── usr/
├── opt/
│   └── myroot/
│       ├── bin/
│       └── lib/
└── ...

# Chrooted process
/
├── bin/          <= actually /opt/myroot/bin
└── lib/          <= actually /opt/myroot/lib
```

But, why would we want to do this? What benefits do we get from giving a process a different view of the filesystem?
As mentioned above, every process can potentially access paths throughout the system if the permission allows it. 
But, usually a process only requires a small set of executables (under `/bin`), libraries (under `/lib`) and maybe configuration files (under `/etc`). Besides, imagine the process we want to run needs different versions of dependencies such as executables or libraries. What if these dependencies conflict with the system's existing configurations?
`chroot` has been useful in serveral situation, including system recovery, building linux system such as Linux From Scratch, testing alternate userspaces, restricting file system view of certain services like FTP. It is also related to how the container environments construct their filesystem hierarchies.
Now, let's take a look into how we can create our own simple chroot jail.

# Creating a Simple `choot` Jail
## Inspecting the current system
```bash
$ ls -l /
total 68
lrwxrwxrwx   1 root   root       7 Oct 13  2025 bin -> usr/bin
drwxr-xr-x   4 root   root    4096 Sep  3 00:02 boot
drwxr-xr-x  20 root   root    4300 Sep  3 11:43 dev
drwxr-xr-x   4 fyodor fyodor  4096 Apr 21 16:03 drive
drwxr-xr-x 105 root   root   12288 Sep  3 14:35 etc
drwxr-xr-x   5 root   root    4096 May 15 10:04 home
lrwxrwxrwx   1 root   root       7 Oct 13  2025 lib -> usr/lib
lrwxrwxrwx   1 root   root       7 Oct 13  2025 lib64 -> usr/lib
drwx------   2 root   root   16384 Nov  9  2024 lost+found
drwxr-xr-x   7 root   root    4096 Sep  2 22:26 media
drwxr-xr-x   3 root   root    4096 Aug 31 18:30 mnt
drwxr-xr-x  10 root   root    4096 Aug 22 19:01 opt
dr-xr-xr-x 313 root   root       0 Sep  2 13:04 proc
drwxr-x---  18 root   root    4096 Aug 31 22:41 root
drwxr-xr-x  35 root   root    1080 Sep  2 23:34 run
lrwxrwxrwx   1 root   root       7 Oct 13  2025 sbin -> usr/bin
drwxr-xr-x   7 root   root    4096 Aug 31 20:16 srv
dr-xr-xr-x  13 root   root       0 Sep  2 13:04 sys
drwxrwxrwt  17 root   root     640 Sep  3 15:03 tmp
drwxr-xr-x  11 root   root    4096 Sep  3 00:01 usr
drwxr-xr-x  13 root   root    4096 Sep  2 13:04 var
```

## Create a directory
Start by creating a directory and some directories under it.
```bash
mkdir -p /opt/jailroot
mkdir -p /opt/jailroot/bin
```

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
$ tree
.
├── bin
│   ├── bash
│   └── ls
├── etc
│   └── bash.bashrc
├── lib -> usr/libk
├── lib64
│   └── ld-linux-x86-64.so.2
└── usr
    └── lib
        ├── libcap.so.2
        ├── libc.so.6
        ├── libncursesw.so.6
        └── libreadline.so.8

7 directories, 8 files
```


Add symbolic link `lib` -> `usr/lib`

```bash
ln -s usr/lib lib
```
