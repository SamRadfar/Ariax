<div dir="rtl">

![ARIAX](assets/banner.png)

# آریاکس

**اپلیکیشن ثبت تمرین و وزن بدن برای آیفون و اندروید. بدون حساب کاربری، بدون سرور، بدون تبلیغات.**

آریاکس یک fork شخصی از [openGym-fa](https://github.com/Jenesyx/opengym-fa) است که روی نسخه‌ی موبایل تمرکز دارد: برنامه کاملاً روی گوشی اجرا می‌شود، داده‌های تمرین در حافظه‌ی خصوصی اپ می‌مانند و هیچ چیزی به جایی ارسال نمی‌شود. رابط کاربری فارسی و انگلیسی (و ۱۱ زبان دیگر)، ۱۳۲۴ حرکت با انیمیشن، پیشروی خودکار وزنه، تخمین یک‌تکرار بیشینه، نقشه‌ی حرارتی فعالیت و نقشه‌ی عضلات.

[English](README.md) · **فارسی**

### چیزی که در این fork اضافه شده

**گرم‌کردن پیش از تمرین** — یک دور ثابت سه‌دقیقه‌ای شامل شش حرکت با شدت متوسط (Jumping Jacks، Jump Squat، Butt Kicks، Burpee، Pop Squat، Shuffle)؛ هر حرکت ۲۰ ثانیه، بین هر دو حرکت ۱۰ ثانیه فاصله، و ۱۰ ثانیه آماده‌شدن در ابتدا. از صفحه‌ی خانه و از صفحه‌ی شروع تمرین در دسترس است. حلقه‌ی شمارش معکوس، صدا و لرزش در هر تغییر مرحله، دکمه‌ی توقف و رد کردن، و روشن ماندن صفحه در طول اجرا. چیزی ثبت نمی‌شود — این آماده‌سازی است، نه یک جلسه‌ی تمرین.

---

## قبل از اولین بیلد

دو مقدار در این مخزن جای‌گیر (placeholder) هستند — همین حالا تغییرشان بده، نه بعداً:

| کجا | چه چیزی | توضیح |
|---|---|---|
| `package.json` | عبارت `YOUR-GITHUB-USERNAME` در `repository` و `homepage` و `bugs` | فقط ظاهری |
| همه‌جا | شناسه‌ی اپ `app.ariax.gym` | **بعد از اولین نصب قابل تغییر نیست** — اندروید نسخه‌ی جدید را روی اپی که شناسه‌اش عوض شده نصب نمی‌کند |

اگر شناسه‌ی دیگری می‌خواهی، باید در این فایل‌ها عوضش کنی: `frontend/capacitor.config.json` و `frontend/android/app/build.gradle` و `frontend/android/app/src/main/res/values/strings.xml` و `frontend/ios/App/App.xcodeproj/project.pbxproj`، و پوشه‌ی پکیج جاوا یعنی `frontend/android/app/src/main/java/app/ariax/gym/` را (همراه با خط `package` داخل `MainActivity.java`) هم‌نام کنی.

## ساخت اپ

<div dir="ltr">

```sh
cd frontend
npm install
npm run build:mobile     # بیلد وب + همگام‌سازی با android/ و ios/
```

</div>

بعد از هر تغییر در کد وب، قبل از بیلد نیتیو دوباره `build:mobile` را اجرا کن.

### اندروید

به Android Studio (برای SDK) و Java 21 نیاز داری.

<div dir="ltr">

```sh
npx cap open android
```

</div>

برای ساخت APK قابل نصب:

<div dir="ltr">

```sh
cd android && ./gradlew assembleRelease

# یک‌بار برای همیشه — این keystore را نگه دار، آپدیت‌ها باید با همین کلید امضا شوند
keytool -genkeypair -keystore ariax.keystore -alias ariax -keyalg RSA -validity 10950

zipalign -f -p 4 app/build/outputs/apk/release/app-release-unsigned.apk aligned.apk
apksigner sign --ks ariax.keystore --ks-key-alias ariax --out ARIAX.apk aligned.apk
```

</div>

### آیفون

به یک مک با Xcode نسخه ۱۵ به بالا و CocoaPods نیاز داری (`brew install cocoapods`).

<div dir="ltr">

```sh
npx cap open ios
```

</div>

در Xcode از بخش Signing & Capabilities تیم اپل‌آی‌دی خودت را انتخاب کن و Run بزن. با اپل‌آی‌دی رایگان می‌توانی اپ را روی آیفون خودت نصب کنی، ولی امضا بعد از ۷ روز منقضی می‌شود و باید دوباره از Xcode اجرایش کنی. حساب توسعه‌دهنده‌ی پولی این مدت را به یک سال می‌رساند. نسخه‌ی App Store وجود ندارد — شرایط فروشگاه اپل با لایسنس AGPL جور در نمی‌آید و این یک اپ شخصی است.

## آیکون و برندینگ

فایل `frontend/resources/icon.svg` (۱۰۲۴×۱۰۲۴) تنها منبع آیکون است. بعد از ویرایش آن:

<div dir="ltr">

```sh
cd frontend
npx @capacitor/assets generate --iconBackgroundColor '#0c0e12' --splashBackgroundColor '#0c0e12'
```

</div>

این دستور همه‌ی mipmapهای اندروید، کاتالوگ آیکون iOS و صفحه‌های splash را دوباره می‌سازد. آیکون‌های PWA در `frontend/public/` (یعنی `icon-180.png` و `icon-512.png`) هم از همین فایل خروجی گرفته شده‌اند. رنگ پیش‌فرض برنامه در `frontend/src/store/useStore.js` تعیین می‌شود و هر هشت رنگ در تنظیمات قابل انتخاب باقی مانده است.

## داده‌های تو

نسخه‌ی موبایل همه‌چیز را در فایل `ariax-state.json` در پوشه‌ی خصوصی اپ نگه می‌دارد — برای اپ‌های دیگر قابل دیدن نیست و با حذف برنامه پاک می‌شود. **هرازگاهی از مسیر تنظیمات ← داده‌ها یک نسخه‌ی پشتیبان بگیر**؛ خروجی از طریق منوی اشتراک‌گذاری سیستم می‌آید، پس می‌توانی آن را در Files یا تلگرام یا ایمیل ذخیره کنی.

## نسخه‌ی وب (self-hosted)

همین کد هنوز به‌صورت وب‌اپ روی سرور خودت هم اجرا می‌شود، با ورود Passkey و همگام‌سازی بین دستگاه‌ها (`docker compose up -d --build`). مستندات کامل پروژه‌ی اصلی در [docs/README.upstream.fa.md](docs/README.upstream.fa.md) و [docs/SELF_HOSTING.md](docs/SELF_HOSTING.md) است.

## اعتبار و لایسنس

آریاکس یک fork است — کار اصلی مال من نیست. openGym اصلی از **Duarte Santos** و نسخه‌ی فارسی openGym-fa از **[آرتا (Jenesyx)](https://github.com/Jenesyx)**. این fork فقط نام، آیکون و رنگ را تغییر داده است.

لایسنس [GNU AGPL v3.0](LICENSE) — می‌توانی استفاده، تغییر و بازنشرش کنی؛ اگر نسخه‌ی تغییریافته را به‌صورت سرویس آنلاین اجرا کردی، باید سورس همان نسخه را با همین لایسنس در دسترس بگذاری. تصاویر و گیف‌های حرکات از دیتاست بالادستی می‌آیند و شرایط خودشان را دارند، به [NOTICE.md](NOTICE.md) نگاه کن.

</div>
