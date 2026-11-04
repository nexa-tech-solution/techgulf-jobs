import type { Locale } from "@/lib/i18n";

interface PrivacyContent { title: string; updated: string; sections: { heading: string; items: string[] }[] }

export const PRIVACY: Record<Locale, PrivacyContent> = {
  en: {
    title: "Privacy policy",
    updated: "Last updated: 4 November 2026",
    sections: [
      { heading: "What we collect", items: [
        "Your Google account name and email when you sign in.",
        "The profile you enter: job title, experience, location, target countries, visa needs, skills and optional WhatsApp number.",
        "Your CV file, if you upload one while signed in with a profile.",
        "Jobs you save, your application statuses and your job alerts.",
        "Usage, performance and error data, such as pages viewed, device, browser and approximate location.",
      ] },
      { heading: "How we use it", items: [
        "To run your account, keep your profile and saved items across devices, and score jobs against the skills you choose.",
        "To understand how the site is used and to fix errors.",
        "We don't currently read the contents of your CV to fill your profile or score jobs.",
      ] },
      { heading: "Who can see it", items: [
        "We don't sell your data, and we don't send your CV or profile to employers. Applying opens the employer's own site, where their terms apply.",
        "Google Firebase stores and processes this data for us, and may process it outside your country.",
      ] },
      { heading: "How long we keep it", items: [
        "Your CV stays until you replace or delete it. Only your latest CV is kept.",
        "Your account data stays until you delete your account.",
        "Usage, performance and error data is kept under our Firebase settings and isn't removed when you delete your account.",
      ] },
      { heading: "Your choices", items: [
        "Change your profile or delete your CV at any time on your profile page.",
        "Delete your account and its data permanently from the same page.",
      ] },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    updated: "آخر تحديث: 4 نوفمبر 2026",
    sections: [
      { heading: "ما نجمعه", items: [
        "اسمك وبريدك في حساب Google عند تسجيل الدخول.",
        "الملف الذي تدخله: المسمى الوظيفي والخبرة والموقع والدول المستهدفة واحتياج التأشيرة والمهارات ورقم واتساب الاختياري.",
        "ملف سيرتك الذاتية، إذا رفعته وأنت مسجّل الدخول ولديك ملف.",
        "الوظائف التي تحفظها وحالات طلباتك وتنبيهات الوظائف.",
        "بيانات الاستخدام والأداء والأخطاء، مثل الصفحات المعروضة والجهاز والمتصفح والموقع التقريبي.",
      ] },
      { heading: "كيف نستخدمها", items: [
        "لتشغيل حسابك والاحتفاظ بملفك وعناصرك المحفوظة عبر الأجهزة، وحساب تطابق الوظائف مع المهارات التي تختارها.",
        "لفهم طريقة استخدام الموقع وإصلاح الأخطاء.",
        "لا نقرأ حالياً محتوى سيرتك لملء ملفك أو حساب التطابق.",
      ] },
      { heading: "من يمكنه رؤيتها", items: [
        "لا نبيع بياناتك، ولا نرسل سيرتك أو ملفك إلى أصحاب العمل. يفتح التقديم موقع صاحب العمل، وتسري عليه شروطه.",
        "تخزّن خدمة Google Firebase هذه البيانات وتعالجها لصالحنا، وقد تعالجها خارج بلدك.",
      ] },
      { heading: "مدة الاحتفاظ بها", items: [
        "تبقى سيرتك حتى تستبدلها أو تحذفها. نحتفظ بأحدث سيرة فقط.",
        "تبقى بيانات حسابك حتى تحذف حسابك.",
        "تُحفظ بيانات الاستخدام والأداء والأخطاء وفق إعدادات Firebase لدينا، ولا تُحذف عند حذف حسابك.",
      ] },
      { heading: "خياراتك", items: [
        "عدّل ملفك أو احذف سيرتك في أي وقت من صفحة ملفك.",
        "احذف حسابك وبياناته نهائياً من الصفحة نفسها.",
      ] },
    ],
  },
};
