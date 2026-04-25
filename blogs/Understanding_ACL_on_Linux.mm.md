title: Linux တွင် Access Control List နားလည်ခြင်း
image: images/UnderstandingACL/understanding_acl_thumbnail.jpg
description: POSIX Access Control List အတွက် လက်တွေ့သုံး လမ်းညွှန်။
cover: images/UnderstandingACL/understanding_acl_thumbnail.jpg

# မာတိကာ

- Access Control List အဘယ်ကြောင့် အရေးကြီးသနည်း
- ACL အသွင်အပြင်များကို ကြည့်ရှုခြင်း
- ACL အသွင်အပြင်များ ထည့်သွင်းခြင်းနှင့် ပြင်ဆင်ခြင်း
- ACL Mask ကို နားလည်ခြင်း
- လမ်းညွှန်များတွင် ACL ကို recursive အသုံးပြုခြင်း
- ဖိုင်အသစ်များအတွက် Default ACL သတ်မှတ်ခြင်း
- ကိုးကားချက်များ

# Access Control List အဘယ်ကြောင့် အရေးကြီးသနည်း

ရိုးရာအားဖြင့်၊ Linux (UNIX) စနစ်များတွင် ဖိုင်နှင့် လမ်းညွှန်ခွင့်ပြုချက်များသည် `user`၊ `group` နှင့် `other` တို့တွင်သာ ကန့်သတ်ထားသည်ကို ကျွန်ုပ်တို့ အားလုံး သိသည်။ သို့သော် ဖိုင်ခွင့်ပြုချက်များကို အသေးစိတ် ထိန်းချုပ်ရန် လိုအပ်သောအခါ ဤနည်းသည် ကန့်သတ်ချက်များစွာ ဖြစ်လာသည်။ ဥပမာ၊ တစ်ဦးတည်းသော သတ်မှတ်ထားသည့် user တစ်ဦးကို ခွင့်ပြုချက်ပေးလိုသောအခါ မည်သို့ပြုလုပ်ရမည်နည်း? Group အများစုကို ဝင်ရောက်ခွင့်ပေးလိုသောအခါ မည်သို့ပြုလုပ်ရမည်နည်း? Owner မဟုတ်သော၊ ခွင့်ပြုထားသည့် group ၏ အဖွဲ့ဝင်လည်းမဟုတ်သော user တစ်ဦးကို ဝင်ရောက်ခွင့်ပေးရန် လိုအပ်သောအခါ မည်သို့ပြုလုပ်ရမည်နည်း? ဤနေရာတွင် **Access Control List (ACL)** ဝင်ရောက်လာသည်။ ဤဆောင်းပါးတွင် Linux စနစ်များတွင် ACL (***POSIX ACLs - [acl(5)](https://man7.org/linux/man-pages/man5/acl.5.html)***) ၏ အခြေခံများနှင့် လက်တွေ့အသုံးပြုမှုများကို ဆွေးနွေးမည်ဖြစ်သည်။

ACL နှင့်ဆိုင်သည့် command များ မစတင်မီ၊ သင်၏ Linux distribution အတွက် လိုအပ်သည့် package ကို install ပြုလုပ်ထားရမည်ကို သေချာပါစေ။ RedHat-based distributions အတွက်၊ `acl` package ကို အောက်ပါအတိုင်း install ပြုလုပ်နိုင်သည်။

```
dnf install acl
```

# ACL အသွင်အပြင်များကို ကြည့်ရှုခြင်း

အောက်ပါ command ဖြင့် ဖိုင်တစ်ခု၏ ACL အသွင်အပြင်များကို ကြည့်ရှုနိုင်သည်။

```
[root@localhost:demo] # getfacl file.txt
# file: file.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--

[root@localhost:demo] #
```

ဤနေရာတွင် `user::rw-` ထဲရှိ **user** သည် `owner: root` ထဲရှိ **root** ကို ကိုယ်စားပြုပြီး ဖိုင်ကို ဖတ်ခြင်းနှင့် ရေးခြင်း ခွင့်ပြုချက်ရှိသည်ကို တွေ့နိုင်သည်။ ထို့အတူ `group: root` သည် `group::r--` မှ သတ်မှတ်ထားသည့်အတိုင်း ဖိုင်ကို ဖတ်ခြင်းသာ ခွင့်ပြုချက်ရှိသည်။ `other::r--` ဆိုသည်မှာ အခြားသူများကို ဖတ်ခြင်းသာ ခွင့်ပြုချက်သတ်မှတ်ထားသည်။

ACL အသွင်အပြင်များ မသတ်မှတ်ရသေးသောကြောင့် ဤ output သည် `ls -l` command ၏ output နှင့် တိုက်ရိုက်တူညီသည်။

```
[root@localhost:demo] # ls -l file.txt
-rw-r--r--. 1 root root 0 Dec 14 13:07 file.txt
```

ထို့အတူ၊ အောက်ပါ command သည် `dir1/` လမ်းညွှန်၏ ACL အသွင်အပြင်များကို ပြသည်။

```
[root@localhost:demo] # getfacl dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

[root@localhost:demo] #

```

> `dir1/` သည် လမ်းညွှန်ဖြစ်သော်လည်း ဖိုင်တစ်ခုအဖြစ် ယူဆသည်ကို သတိပြုပါ။ ဤသည်မှာ Linux kernel ၏ အမြင်မှ ကြည့်သောအခါ လမ်းညွှန်တစ်ခုကို နောက်ဆုံးတွင် ဖိုင်တစ်ခုအဖြစ် ဆက်ဆံသောကြောင့်ဖြစ်သည်။ ၎င်းသည် Linux တွင် "Everything is a file" ဟူသည့် အယူအဆကို ဆိုလိုသည် (နောက်ပိုင်း ဆောင်းပါးများတွင် ဖိုင်များနှင့်ပတ်သက်၍ ပိုမိုဆွေးနွေးမည်)။

တစ်နည်းအားဖြင့် `-R` flag ဖြင့် လမ်းညွှန်တစ်ခုနှင့် ၎င်း၏ ပါဝင်မှုများ၏ ACL အသွင်အပြင်များကို recursive ဖြင့် စာရင်းကောက်နိုင်သည်။

```
[root@localhost:demo] # tree dir1/
dir1/
├── file2.txt
└── sub1
    └── sub2

2 directories, 1 file
[root@localhost:demo] # getfacl -R dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1//sub1
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1//sub1/sub2
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1//file2.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--

[root@localhost:demo] #

```

# ACL အသွင်အပြင်များ ထည့်သွင်းခြင်းနှင့် ပြင်ဆင်ခြင်း

ရိုးရာ UNIX ခွင့်ပြုချက်များ (`user::rwx`၊ `group::rwx`၊ `other::rwx`) နှင့် မတူဘဲ POSIX ACL ကို အသုံးပြုခြင်းသည် ဖိုင်ခွင့်ပြုချက်များကို ပိုမိုအသေးစိတ် ထိန်းချုပ်နိုင်မှု ပေးသည်။

ACL အသွင်အပြင်တစ်ခု ထည့်သွင်းခြင်းသည် ရိုးရှင်းသော လုပ်ငန်းစဉ်တစ်ခုဖြစ်သည်။ ဤဖွဲ့စည်းပုံ (***ACL entry specification***) ကို လိုက်နာ၍ format ကို သတ်မှတ်ရုံသာဖြစ်သည်။

```
TYPE:NAME:PERM
```

**TYPE** field သည် `user`၊ `group` သို့မဟုတ် `other` ဖြစ်နိုင်သည်။ ၎င်းတို့ကို အတိုကောက် `u`၊ `g` နှင့် `o` ဟုလည်း ရေးနိုင်သည်။

`user::rw-`၊ `group::r--`၊ `other::r--` ကဲ့သို့ သက်ဆိုင်မှုမရှိသောအခါ NAME field ကို ချန်လှပ်ထားနိုင်သည်။

## ပထမဆုံး ACL အသွင်အပြင်ကို ထည့်သွင်းခြင်း

***modify*** ဆိုသည့် `-m` flag ဖြင့် `setfacl` command ကိုအသုံးပြု၍ ACL အသွင်အပြင်အသစ်ကို ထည့်သွင်းနိုင်သည်။ ၎င်း flag ၏ နောက်တွင် ACL entry specification ပါဝင်ပြီး ***[setfacl(1)](https://man7.org/linux/man-pages/man1/setfacl.1.html)*** ၏ ***ACL ENTRIES*** နှင့် ***ACL TEXT FORMS*** အပိုင်းများကို ကိုးကားရန် အကြံပြုသည်။

အောက်ပါ command သည် `file.txt` ကို user `alice` အတွက် ဖတ်ခြင်းနှင့် ရေးခြင်း ခွင့်ပြုချက်ပေး၍ **named user** အတွက် ACL အသွင်အပြင်ကို ထည့်သွင်းသည်။

```
[root@localhost:demo] # setfacl -m user:alice:rw- file.txt
[root@localhost:demo] # getfacl file.txt
# file: file.txt
# owner: root
# group: root
user::rw-
user:alice:rw-
group::r--
mask::rw-
other::r--

[root@localhost:demo] #

```

ဤနေရာတွင် `user:alice:rw-` ဟူသော အသွင်အပြင်အသစ်တစ်ခု ထည့်သွင်းခဲ့ကြောင်း တွေ့မြင်နိုင်သည်။

`ls -l` ၏ command output တွင် ဖိုင်ခွင့်ပြုချက် အပိုင်း၏ နောက်ဆုံးအက္ခရာ `.` မှ `+` သို့ ပြောင်းလဲသွားပြီး ACL ကို သုံးစွဲပြီးကြောင်း ဆိုလိုသည်ကို သတိပြုပါ။

```
# ACL အသွင်အပြင် ထည့်သွင်းမတိုင်မီ
-rw-r--r--. 1 root root 0 Dec 15 18:39 file.txt

# ACL အသွင်အပြင် ထည့်သွင်းပြီးနောက်
-rw-rw-r--+ 1 root root 0 Dec 15 18:39 file.txt
```

Group ခွင့်ပြုချက်သည် read-only (`r--`) မှ alice ကို ကြိုတင်ပေးထားသည့် ခွင့်ပြုချက် (`rw-`) သို့ ပြောင်းလဲသွားကြောင်းလည်း သတိပြုပါ။ `umask` နှင့်ပတ်သက်၍ ဆွေးနွေးသောအခါ ဤအကြောင်းကို နောက်ပိုင်းတွင် ထပ်မံ ဆွေးနွေးမည်။

ဤ entry ကို အောက်ပါ command ဖြင့် ဖယ်ရှားနိုင်သည်။

```
setfacl -x user:alice file.txt
```

တစ်နည်းအားဖြင့် ACL အသွင်အပြင်များ အားလုံးကို ဖယ်ရှားပြီး ဖိုင်ကို မူလခွင့်ပြုချက်သို့ ပြန်ထောက်ခိုင်းနိုင်သည်။

```
setfacl -b file.txt
```

ဤ command သည် ACL ကို ၎င်း၏ base ခွင့်ပြုချက် အခြေအနေသို့ reset ပြုလုပ်သည်။

## ACL အသွင်အပြင်များ ပိုမိုသိရှိခြင်း

**named group** အတွက် entry တစ်ခုကိုလည်း တူညီသော နည်းလမ်းဖြင့် ထည့်သွင်းနိုင်သည်။

```
setfacl -m group:mgmt:rw- file.txt
```

Comma ဖြင့် ခြားကာ entry အများစုကိုလည်း ထည့်သွင်းနိုင်သည်။

```
setfacl -m u:bob:rw-,g:devteam:rw- file.txt
```

# ACL Mask ကို နားလည်ခြင်း

ACL ထဲရှိ mask သည် `owner` နှင့် `other` ကို ချန်လှပ်၍ named user နှင့် group ACL အသွင်အပြင်များ အားလုံးအတွက် အများဆုံး ထိရောက်သော ခွင့်ပြုချက်ကို သတ်မှတ်သည်။

User သို့မဟုတ် group တစ်ခုအတွက် ACL အသွင်အပြင်အသစ်တစ်ခု ထည့်သောအခါတိုင်း mask ကို အလိုအလျောက် ဖန်တီးသည်။

ACL အသွင်အပြင်မထည့်မီ mask နှင့်ဆိုင်သည့် မည်သည့် line မျှ မပါဝင်ပါ။

```
[root@localhost:demo] # ls -l test.txt
-rw-r--r--. 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] # getfacl test.txt
# file: test.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--
```

သို့သော် ACL အသွင်အပြင်တစ်ခု ထည့်သွင်းပြီးနောက် mask entry ကို အလိုအလျောက် ထည့်သွင်းသည်။

```
[root@localhost:demo] # setfacl -m u:alice:r-- test.txt
[root@localhost:demo] # ls -l test.txt
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] # getfacl test.txt
# file: test.txt
# owner: root
# group: root
user::rw-
user:alice:r--
group::r--
mask::r--
other::r--
```

Mask entry `mask::r--` ကို အလိုအလျောက် ထည့်သွင်းပြီးကြောင်း တွေ့မြင်နိုင်သည်။

`ls -l` command ၏ နောက်ဆုံးအက္ခရာ `.` မှ `+` သို့ ပြောင်းလဲကြောင်း သတိပြုပါ၊ ဤသည်မှာ ACL ကို သုံးစွဲပြီးကြောင်း ဆိုလိုသည်။

```
# ACL မသုံးမီ
-rw-r--r--. 1 root root 0 Dec 15 20:41 test.txt

# ACL သုံးပြီးနောက်
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
```

ACL အသွင်အပြင်တစ်ခုထပ်ထည့်ကြည့်ကြစို့။

```
[root@localhost:demo] # ls -l test.txt
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] # setfacl -m u:bob:rw- test.txt
[root@localhost:demo] # getfacl test.txt
# file: test.txt
# owner: root
# group: root
user::rw-
user:bob:rw-
user:alice:r--
group::r--
mask::rw-
other::r--

[root@localhost:demo] # ls -l test.txt
-rw-rw-r--+ 1 root root 0 Dec 15 20:41 test.txt
[root@localhost:demo] #
```

Mask သည် အများဆုံး ထိရောက်သော ခွင့်ပြုချက်ဖြစ်သောကြောင့် ၎င်း၏ တန်ဖိုး `rw-` သို့ ပြောင်းလဲကြောင်း တွေ့မြင်နိုင်သည်။

ထို့ပြင် ယခင် `ls -l` command ၏ output နှင့် နှိုင်းယှဉ်သောအခါ group ခွင့်ပြုချက် bits များ `r--` မှ `rw-` သို့ ပြောင်းလဲသွားကြောင်း တွေ့နိုင်မည်ဖြစ်သည်။

```
# ACL မသုံးမီ
-rw-r--r--. 1 root root 0 Dec 15 20:41 test.txt
# r-- သည် group::r-- နှင့် ကိုက်ညီသည်

# ACL သုံးပြီးနောက် (alice ထည့်ပြီး)
-rw-r--r--+ 1 root root 0 Dec 15 20:41 test.txt
# r-- သည် mask::r-- နှင့် ကိုက်ညီသည်

# ACL သုံးပြီးနောက် (bob ထည့်ပြီး)
-rw-rw-r--+ 1 root root 0 Dec 15 20:41 test.txt
# rw- သည် mask::rw- နှင့် ကိုက်ညီသည်
```

ဤသည်မှာ ACL မရှိသောအခါ `ls -l` command ဖြင့် ပြသသော group ခွင့်ပြုချက် bits များသည် တိုက်ရိုက်ကိုက်ညီသောကြောင့်ဖြစ်သည်-

```
group::r--
```

ဤ output သည် `getfacl test.txt` command မှ ပြသသည်။

သို့သော် ACL အသွင်အပြင်ထည့်ပြီးသောအခါ group ခွင့်ပြုချက် bits များသည် mask entry နှင့် ကိုက်ညီသည်-

```
mask::rw-
```

ဤရှုပ်ထွေးမှုများ ဘာကြောင့် လိုအပ်သည်ဟု သင် တွေးနေပေမည်။ ၎င်းသည် ရိုးရာ UNIX ခွင့်ပြုချက်များ (`user`၊ `group` နှင့် `other`) ကိုသာ နားလည်သည့် program များနှင့် တွဲဖက်လုပ်ဆောင်နိုင်ရန် mask ရှိသောကြောင့်ဖြစ်သည်။ Mask ကို ACL နှင့် ရိုးရာ UNIX ခွင့်ပြုချက်များကြား တွဲဖက်လုပ်ဆောင်နိုင်မှုအတွက် လိုအပ်သော ဘာသာပြန်ဆိုမှုများ ပြုလုပ်ပေးသည့် အလယ်အလတ်လူတစ်ဦးအဖြစ် ထင်မြင်နိုင်သည်။

ရိုးရှင်းသော ဘာသာစကားဖြင့် ပြောရလျှင်၊ နောက်ဆုံးအက္ခရာ `.` ဖြစ်သောအခါ group ခွင့်ပြုချက် bits များသည် ရိုးရာ UNIX ခွင့်ပြုချက်များဖြစ်သည်။

ထို့အတူ နောက်ဆုံးအက္ခရာ `+` ဖြစ်သောအခါ POSIX ACL ကို သုံးစွဲပြီးဖြစ်ပြီး group ခွင့်ပြုချက် bits များသည် mask ကို ကိုယ်စားပြုသည်။

***[acl(5)](https://man7.org/linux/man-pages/man5/acl.5.html)*** ၏ ***CORRESPONDENCE BETWEEN ACL ENTRIES AND FILE PERMISSION BITS*** အပိုင်းကို ကိုးကားနိုင်သည်။

## ထိရောက်သော ခွင့်ပြုချက်များ

ထိရောက်သော ခွင့်ပြုချက်ဆိုသည်မှာ ACL entry ပေါ်ရှိ ခွင့်ပြုချက်မည်သည်ပင်ဖြစ်စေ အမှန်တကယ် သုံးစွဲနေသည့် ခွင့်ပြုချက်ဖြစ်သည်။

`file1.txt` ဟူသည့် ဖိုင်တစ်ခုရှိပြီး user **boss** ကို ဖတ်ခြင်းနှင့် ရေးခြင်း ခွင့်ပြုချက်ပေးထားသည်ဟု ဆိုကြပါစို့။

```
[root@localhost:demo] # touch file1.txt
[root@localhost:demo] # setfacl -m u:boss:rw- file1.txt
[root@localhost:demo] # getfacl file1.txt
# file: file1.txt
# owner: root
# group: root
user::rw-
user:boss:rw-
group::r--
mask::rw-
other::r--
```

`mask::rw-` mask ကို ထည့်သွင်းပြီးကြောင်း သတိပြုပါ။

Mask ကို `mask::r--` သို့ ပြင်ဆင်ခြင်းဖြင့် user **boss** ကို ပေးထားသော ခွင့်ပြုချက်ကိုလည်း ကန့်သတ်သွားမည်ဖြစ်သည်။

```
[root@localhost:demo] # setfacl -m mask::r file1.txt
[root@localhost:demo] # getfacl file1.txt
# file: file1.txt
# owner: root
# group: root
user::rw-
user:boss:rw-			#effective:r--
group::r--
mask::r--
other::r--
```

ယခုအချိန်တွင် user **boss** သည် ဖိုင်ကို read-only mode ဖြင့်သာ ဝင်ရောက်ကြည့်ရှုနိုင်သည်။

Mask ကိုပြင်ဆင်ခြင်းသည် ခွင့်ပြုချက်များကို ယာယီ ကန့်သတ်ခြင်း သို့မဟုတ် ပြန်ထားက်ခြင်းအတွက် အသုံးဝင်သည်။

ACL ခွင့်ပြုချက်များ အားလုံးကို ယာယီ ပိတ်ဆို့နိုင်သည်။

```
setfacl -m m::--- test.txt
```

နောက်မှ mask ကို ပြင်ဆင်၍ ဝင်ရောက်ခွင့် ပြန်ထားနိုင်သည်။

```
setfacl -m m::rw- test.txt
```

# လမ်းညွှန်များတွင် ACL ကို Recursive အသုံးပြုခြင်း

ဖိုင်များတွင် ပြုလုပ်သကဲ့သို့ပင် လမ်းညွှန်တစ်ခုတွင် ACL အသွင်အပြင်တစ်ခု ထည့်သွင်းနိုင်သည်။

```
[root@localhost:demo] # setfacl -m u:bob:rwx dir1/
[root@localhost:demo] # getfacl dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

[root@localhost:demo] #
```

သို့သော် ၎င်းသည် ၎င်း၏ အောက်တွင်ရှိသော ဖိုင်များနှင့် sub-directory များကို သက်ရောက်မှုမဖြစ်ပေ။

```
[root@localhost:demo] # getfacl dir1/sub1/; getfacl dir1/file2.txt
# file: dir1/sub1/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

# file: dir1/file2.txt
# owner: root
# group: root
user::rw-
group::r--
other::r--

[root@localhost:demo] #

```

> ဤနေရာတွင် **bob** အတွက် entry မထည့်ကြောင်း တွေ့နိုင်သည်။

ACL entry ကို အတွင်းရှိ ဖိုင်များနှင့် sub-directory များတွင်ပါ ထည့်သွင်းရန် `getfacl` ကိုအသုံးပြု၍ လမ်းညွှန်တစ်ခုနှင့် ၎င်း၏ ပါဝင်မှု ACL specification ကို ရယူသကဲ့သို့ `-R` option ဖြင့် recursive mode ကို ဖွင့်ရမည်ဖြစ်သည်။

```
[root@localhost:demo] # setfacl -b dir1/
[root@localhost:demo] # setfacl -Rm u:bob:rwx dir1/
[root@localhost:demo] # getfacl -R dir1/
# file: dir1/
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

# file: dir1//sub1
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

# file: dir1//sub1/sub2
# owner: root
# group: root
user::rwx
user:bob:rwx
group::r-x
mask::rwx
other::r-x

# file: dir1//file2.txt
# owner: root
# group: root
user::rw-
user:bob:rwx
group::r--
mask::rwx
other::r--

[root@localhost:demo] #
```

လမ်းညွှန်တစ်ခုကို recursive ဖြင့် ခွင့်ပြုချက်ပေးသောအခါ ဖိုင်များကို execute ခွင့်ပြုချက် မတော်တဆ ပေးမိနိုင်သည်။

User **bob** ကို `file1.txt` နှင့် `file2.txt` တို့ကို read-only ဖြင့်သာ ဝင်ရောက်ရန် ပေးလိုသောအခါ မည်သို့ပြုလုပ်မည်နည်း။

```
project/
├── file1.txt
└── notes
    └── file2.txt

1 directory, 2 files
```

အောက်ပါအတိုင်း ပြုလုပ်လျှင်-

```
setfacl -Rm u:bob:r-- project/
```

execute ခွင့်ပြုချက် မပေးသောကြောင့် bob သည် `project/` နှင့် `notes/` လမ်းညွှန်တွင် `cd` မလုပ်နိုင်ဘဲ ဖိုင်များကို ဖတ်ရှုနိုင်မည် မဟုတ်ပါ။ ထို့ကြောင့် execute ခွင့်ပြုချက် ပေးရမည်ဖြစ်သည်။

```
setfacl -Rm u:bob:r-x project/
```

သို့သော် ၎င်းပြုလုပ်ခြင်းဖြင့် `file1.txt` နှင့် `file2.txt` တို့ကိုပါ execute ခွင့်ပြုချက် ပေးသွားမည်ဖြစ်ပြီး ၎င်းကို ရည်ရွယ်ခြင်း မဟုတ်ပါ။

ဖိုင်များကို execute ခွင့်ပြုချက် မပေးဘဲ ကြောင့် ရှောင်ရန် အကြီးစာ `X` ကိုအသုံးပြု၍ လမ်းညွှန်များတွင်သာ execute ခွင့်ပြုချက် ပေးနိုင်သည်။

```
setfacl -Rm u:bob:r-X project/
```

ဤသို့ ပြုလုပ်ခြင်းဖြင့် **bob** ကို ဖိုင်များကို read-only ဖြင့်သာ၊ sub-directory များကို ဖတ်ခြင်းနှင့် execute ခွင့်ပြုချက် ပေးမည်ဖြစ်သည်။

# Default ACL ကို နားလည်ခြင်း

POSIX ACL သည် မည်သည့် ဖိုင်အသစ်နှင့် sub-directory တို့အတွက်မဆို လမ်းညွှန်တစ်ခုတွင် entry များကို ကြိုတင်သတ်မှတ်နိုင်သည်။ ဤ ကြိုတင်သတ်မှတ်ထားသော entry များကို default ACLs ဟုခေါ်သည်။ Default ACL များသည် လမ်းညွှန်တစ်ခုတွင် သတ်မှတ်ထားသော ခွင့်ပြုချက် template များဖြစ်သည်။ ၎င်းလမ်းညွှန်ထဲတွင် မည်သူမဆို ဖိုင်တစ်ခု သို့မဟုတ် sub-directory တစ်ခု ဖန်တီးသောအခါ item အသစ်သည် default ACL မှ ခွင့်ပြုချက်များကို အလိုအလျောက် ဆက်ခံသည်။

သို့သော် လမ်းညွှန်တစ်ခုတွင် default ACL သတ်မှတ်ခြင်းသည် လမ်းညွှန်ကိုယ်တိုင်၏ ခွင့်ပြုချက်များနှင့် ၎င်း၏ ရှိပြီးသား ပါဝင်မှုများ၏ ခွင့်ပြုချက်များကို သက်ရောက်မှုမဖြစ်စေပါ။

အောက်ပါ command သည် user `alice` ကို ဖိုင်အသစ်များကို ရေးခြင်း ခွင့်ပြုချက်ပေး၍ လမ်းညွှန် tree တစ်ခုတွင် default ACL သတ်မှတ်ခြင်းကို ပြသသည်။

```
project/
├── file1.txt
└── notes
    └── file2.txt

1 directory, 2 files
```

```
[root@localhost:demo] # setfacl -dm u:alice:rw- project/
```

တစ်နည်းအားဖြင့် `-d` flag မသုံးဘဲ အောက်ပါ line ဖြင့် default ACL သတ်မှတ်နိုင်သည်။

```
[root@localhost:demo] # setfacl -m default:user:alice:rw- project/
```

`project/` အောက်တွင် ဖိုင် သို့မဟုတ် လမ်းညွှန်တစ်ခု ဖန်တီး၍ ACL entry များကို စစ်ဆေးခြင်းဖြင့် ဤသည်ကို အတည်ပြုနိုင်သည်။

```
[root@localhost:demo] # mkdir project/docs
[root@localhost:demo] # getfacl project/docs/
# file: project/docs/
# owner: root
# group: root
user::rwx
user:alice:rw-
group::r-x
mask::rwx
other::r-x
default:user::rwx
default:user:alice:rw-
default:group::r-x
default:mask::rwx
default:other::r-x

[root@localhost:demo] #
```

`user:alice:rw-` ကို အလိုအလျောက် ထည့်သွင်းပြီးကြောင်း တွေ့မြင်နိုင်သည်။

သို့သော် သတိပြုရမည့်အချက်တစ်ချက်ရှိသည်။ Default ACL ကို ဖန်တီးသည့် `docs/` လမ်းညွှန်အသစ်တွင် သုံးစွဲထားသော်လည်း `getfacl` ကို recursive ဖြင့် default ACL သတ်မှတ်ရန် မပြောမချင်း ရှိပြီးသား `notes/` လမ်းညွှန်တွင် မသုံးစွဲပါ။

```
[root@localhost:dir1] # getfacl -R project/
# file: project/
# owner: root
# group: root
user::rwx
group::r-x
other::r-x
default:user::rwx
default:user:alice:rw-
default:group::r-x
default:mask::rwx
default:other::r-x

# file: project//notes
# owner: root
# group: root
user::rwx
group::r-x
other::r-x

...

# file: project//docs
# owner: root
# group: root
user::rwx
user:alice:rw-
group::r-x
mask::rwx
other::r-x
default:user::rwx
default:user:alice:rw-
default:group::r-x
default:mask::rwx
default:other::r-x
```

ဤနေရာတွင် `notes` နှင့် `docs` ၏ entry များကို နှိုင်းယှဉ်နိုင်သည်။

လမ်းညွှန်နှင့် ၎င်း၏ sub-directory များတွင် default ACL ကို recursive သတ်မှတ်ရန် `-R` flag ကို သုံးရမည်ဖြစ်သည်။

```
setfacl -Rdm u:alice:rw- project/
```

Default ACL entry တစ်ခုကို ဖယ်ရှားရန် ပုံမှန် ACL entry များ ဖယ်ရှားသကဲ့သို့ `-x` flag ကို အသုံးပြုနိုင်သည်။

```
setfacl -d -x u:alice project/
# သို့မဟုတ် တစ်နည်းအားဖြင့်
setfacl -x d:u:alice project/
```

`-k` flag ဖြင့် default ACL configuration များ အားလုံးကို ဖယ်ရှားနိုင်သည်။

```
[root@localhost:demo] # setfacl -k project/
[root@localhost:demo] # getfacl project/
# file: project/
# owner: root
# group: root
user::rwx
user:bob:r--
group::r-x
mask::r-x
other::r-x

[root@localhost:demo] #
```

ဤဆောင်းပါးတွင် POSIX Access Control List မှ ပိုမိုအသေးစိတ် ထိန်းချုပ်မှု ပေးရန် ရိုးရာ UNIX ခွင့်ပြုချက် model ကို မည်သို့ တိုးချဲ့ထားသည်ကို ဆွေးနွေးခဲ့သည်။

ရိုးရာ UNIX ခွင့်ပြုချက် model တွင် ဖိုင်နှင့် လမ်းညွှန်များကို ဝင်ရောက်ခြင်းကို `user`၊ `group` နှင့် `other` တို့တွင်သာ ကန့်သတ်ထားသည်။ POSIX ACL သည် သတ်မှတ်ထားသော user များ သို့မဟုတ် group များကို ခွင့်ပြုချက် သတ်မှတ်နိုင်ခြင်းဖြင့် ဤပြဿနာကို ဖြေရှင်းသည်။

ACL entry များ ကြည့်ရှုခြင်းမှ လက်တွေ့ ထည့်သွင်းခြင်းအထိ ACL ကို အသာသာသုံးနိုင်သော နည်းလမ်းများကို လေ့လာခဲ့သည်။ ထို့ပြင် ACL mask နားလည်ခြင်းနှင့် `ls -l` output နှင့် mask များ နှိုင်းယှဉ်ခြင်းဖြင့် ACL သည် ရိုးရာ UNIX ခွင့်ပြုချက်များနှင့် မည်သို့ ဆက်စပ်သည်ကို မြင်ကွင်းကျယ် ရရှိခဲ့သည်။ ဤဆောင်းပါးကို ဤမျှ ဖတ်ခဲ့ပြီးပါက `chown` နှင့် `chmod` တင်ဖြင့် ဖြေရှင်းမရသော ပြဿနာများကို ACL မည်သို့ဖြေရှင်းသည်ကို မြင်ရမည်ဖြစ်သည်။ ACL သည် ရှုပ်ထွေးမှုများ ဖြစ်ပေါ်စေသော်လည်း ခေတ်မီ Linux စနစ်များကို ဘေးကင်းစွာ ယုံကြည်စိတ်ချစွာ စီမံခန့်ခွဲရန်အတွက် ACL မည်သို့ လုပ်ဆောင်သည်ကိုနှင့် ရိုးရာ ခွင့်ပြုချက်များနှင့် မည်သို့ ဆက်ဆံသည်ကို နားလည်ခြင်းသည် အရေးကြီးသည်။

# ကိုးကားချက်များ
- [acl(5)](https://man7.org/linux/man-pages/man5/acl.5.html), [getfacl(1)](https://man7.org/linux/man-pages/man1/getfacl.1.html), [setfacl(1)](https://man7.org/linux/man-pages/man1/setfacl.1.html)
- [How ACL Masks Let You Fine-Tune File Permissions in Linux By Jordan Erickson](https://www.howtogeek.com/how-acl-masks-let-you-fine-tune-file-permissions-in-linux)
- [What relationships tie ACL mask and standard group permission on a file?](https://unix.stackexchange.com/questions/147499/what-relationships-tie-acl-mask-and-standard-group-permission-on-a-file/147502#147502)
