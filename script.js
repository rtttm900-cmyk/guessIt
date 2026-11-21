const words = [
    { word: "أسد", hint: "ملك الغابة ومن أقوى الحيوانات." },
    { word: "طائرة", hint: "وسيلة نقل تطير في السماء." },
    { word: "مدرسة", hint: "مكان يذهب إليه الطلاب للتعلم." },
    { word: "تفاحة", hint: "فاكهة قد تكون حمراء أو خضراء." },
    { word: "بحر", hint: "مساحة واسعة من المياه المالحة." },
    { word: "حاسوب", hint: "جهاز نستخدمه للعمل والألعاب." },
    { word: "قمر", hint: "يظهر في السماء ليلاً." },
    { word: "نحلة", hint: "حشرة تصنع العسل." },
    { word: "مفتاح", hint: "نستخدمه لفتح الأبواب." },
    { word: "ساعة", hint: "تخبرنا بالوقت." },

    { word: "زرافة", hint: "حيوان طويل الرقبة." },
    { word: "موز", hint: "فاكهة صفراء يحبها الكثير." },
    { word: "سفينة", hint: "وسيلة نقل تسير فوق الماء." },
    { word: "مكتبة", hint: "مكان مليء بالكتب." },
    { word: "هاتف", hint: "جهاز نستخدمه للاتصال." },
    { word: "صحراء", hint: "مكان واسع مليء بالرمال." },
    { word: "نمر", hint: "حيوان مفترس له خطوط سوداء." },
    { word: "ثلج", hint: "ماء متجمد ولونه أبيض." },
    { word: "مظلة", hint: "تحمينا من المطر." },
    { word: "مصباح", hint: "يضيء الغرفة في الظلام." },

    { word: "فيل", hint: "حيوان ضخم له خرطوم طويل." },
    { word: "برتقال", hint: "فاكهة حمضية غنية بفيتامين C." },
    { word: "قطار", hint: "وسيلة نقل تسير على القضبان." },
    { word: "مستشفى", hint: "مكان يعالج المرضى." },
    { word: "جبل", hint: "ارتفاع طبيعي كبير على سطح الأرض." },
    { word: "سمكة", hint: "كائن يعيش في الماء." },
    { word: "مرآة", hint: "نرى صورتنا فيها." },
    { word: "قلم", hint: "نستخدمه للكتابة." },
    { word: "وسادة", hint: "نضع رأسنا عليها أثناء النوم." },
    { word: "حديقة", hint: "مكان مليء بالنباتات والأشجار." },

    { word: "ذئب", hint: "حيوان يشبه الكلب ويعيش في البرية." },
    { word: "فراولة", hint: "فاكهة حمراء صغيرة وبها بذور." },
    { word: "سيارة", hint: "وسيلة نقل لها أربع عجلات غالباً." },
    { word: "مطار", hint: "مكان إقلاع وهبوط الطائرات." },
    { word: "نهر", hint: "مجرى مائي عذب." },
    { word: "سلحفاة", hint: "حيوان يحمل درعاً على ظهره." },
    { word: "خبز", hint: "طعام أساسي يصنع من الدقيق." },
    { word: "ثلاجة", hint: "جهاز يحافظ على برودة الطعام." },
    { word: "تلفاز", hint: "نشاهد من خلاله البرامج والأفلام." },
    { word: "مطر", hint: "ماء ينزل من السحب." },

    { word: "دب", hint: "حيوان ضخم يحب العسل في القصص." },
    { word: "عنب", hint: "فاكهة تنمو على شكل عناقيد." },
    { word: "دراجة", hint: "وسيلة نقل لها عجلتان." },
    { word: "مصر", hint: "دولة عربية تشتهر بالأهرامات." },
    { word: "سعودية", hint: "دولة عربية تقع في شبه الجزيرة العربية." },
    { word: "مطرقة", hint: "أداة تستخدم لدق المسامير." },
    { word: "سحابة", hint: "تظهر في السماء وقد تحمل المطر." },
    { word: "نجمة", hint: "جسم مضيء يظهر في السماء ليلاً." },
    { word: "ساعة", hint: "لها عقارب أو شاشة لعرض الوقت." },
    { word: "حقيبة", hint: "نضع فيها أغراضنا ونحملها." },

    { word: "حصان", hint: "حيوان يستخدم في السباقات والركوب." },
    { word: "ليمون", hint: "فاكهة صفراء ذات طعم حامض." },
    { word: "موزة", hint: "فاكهة طويلة ومنحنية." },
    { word: "باب", hint: "ندخل ونخرج من خلاله." },
    { word: "نافذة", hint: "تسمح بدخول الضوء والهواء." },
    { word: "نظارة", hint: "تساعد بعض الناس على الرؤية." },
    { word: "أخطبوط", hint: "كائن بحري له ثمانية أذرع." },
    { word: "بطريق", hint: "طائر لا يطير ويعيش في المناطق الباردة." },
    { word: "تمساح", hint: "زاحف يعيش قرب المياه وله فك قوي." },
    { word: "كنغر", hint: "حيوان يقفز ويحمل صغيره في جراب." },

    { word: "ساعة", hint: "نستخدمها لمعرفة كم مضى من الوقت." },
    { word: "مكيف", hint: "جهاز يبرد هواء الغرفة." },
    { word: "مروحة", hint: "تحرك الهواء لتخفيف الحرارة." },
    { word: "وسام", hint: "علامة تمنح للتكريم." },
    { word: "كرة", hint: "نستخدمها في ألعاب رياضية كثيرة." },
    { word: "ملعب", hint: "مكان تقام فيه المباريات الرياضية." },
    { word: "حارس", hint: "يحمي المرمى في كرة القدم." },
    { word: "صافرة", hint: "يستخدمها الحكم لإيقاف اللعب." },
    { word: "شبكة", hint: "يقع فيها هدف كرة القدم." },
    { word: "بطولة", hint: "منافسة بين لاعبين أو فرق." },

    { word: "موز", hint: "فاكهة مشهورة بلونها الأصفر." },
    { word: "عسل", hint: "مادة حلوة تنتجها النحلة." },
    { word: "حليب", hint: "مشروب أبيض تنتجه بعض الحيوانات." },
    { word: "جبن", hint: "طعام يصنع من الحليب." },
    { word: "أرز", hint: "حبوب تطبخ وتؤكل مع أطعمة كثيرة." },
    { word: "بيتزا", hint: "طعام دائري إيطالي مشهور." },
    { word: "قهوة", hint: "مشروب ساخن يصنع من حبوب محمصة." },
    { word: "شوكولاتة", hint: "حلوى تصنع من الكاكاو." },
    { word: "برتقال", hint: "فاكهة يمكن عصرها لصنع مشروب." },
    { word: "تمر", hint: "ثمرة تنمو على النخيل." },

    { word: "روبوت", hint: "آلة يمكن برمجتها لتنفيذ المهام." },
    { word: "إنترنت", hint: "شبكة عالمية تربط الأجهزة." },
    { word: "كاميرا", hint: "جهاز نستخدمه لالتقاط الصور." },
    { word: "بطارية", hint: "مصدر للطاقة في الأجهزة." },
    { word: "شاشة", hint: "نعرض عليها الصور والمعلومات." },
    { word: "لوحة", hint: "نستخدمها للرسم أو الكتابة." },
    { word: "مفتاح", hint: "أداة صغيرة لفتح القفل." },
    { word: "خريطة", hint: "توضح لنا مواقع الأماكن." },
    { word: "صاروخ", hint: "وسيلة تنطلق إلى الفضاء." },
    { word: "مسبار", hint: "جهاز يرسل لاستكشاف الفضاء." },

    { word: "بركان", hint: "جبل قد تخرج منه الحمم." },
    { word: "زلزال", hint: "اهتزاز يحدث في الأرض." },
    { word: "قوس", hint: "يظهر بألوان متعددة بعد المطر أحياناً." },
    { word: "شلال", hint: "ماء يسقط من مكان مرتفع." },
    { word: "غابة", hint: "مساحة واسعة مليئة بالأشجار." },
    { word: "جزيرة", hint: "أرض تحيط بها المياه." },
    { word: "كوكب", hint: "جرم سماوي يدور حول نجم." },
    { word: "مريخ", hint: "كوكب يعرف بالكوكب الأحمر." },
    { word: "شمس", hint: "النجم الذي يضيء كوكبنا." },
    { word: "فضاء", hint: "المنطقة الواسعة خارج الغلاف الجوي." }
];
let currentWord;
let score = 0;
let level = 1;
let attempts = 5;

function newWord() {
    let random = Math.floor(Math.random() * words.length);

    currentWord = words[random];

    attempts = 5;

    document.getElementById("hint").textContent =
        "التلميح: " + currentWord.hint;

    document.getElementById("message").textContent = "";
    document.getElementById("guess").value = "";
    document.getElementById("guess").disabled = false;

    document.getElementById("attempts").textContent = attempts;
}

function checkGuess() {

    let guess = document.getElementById("guess").value.trim();
    let message = document.getElementById("message");

    if (guess === "") {
        message.textContent = "اكتب إجابتك أولاً!";
        return;
    }

    if (attempts <= 0) {
        message.textContent = "انتهت المحاولات!";
        return;
    }

    if (guess.toLowerCase() === currentWord.word.toLowerCase()) {

        score += 10;
        level = Math.floor(score / 50) + 1;

        document.getElementById("score").textContent = score;
        document.getElementById("level").textContent = level;

        message.textContent = "🎉 إجابة صحيحة! +10 نقاط";

        document.getElementById("guess").disabled = true;

    } else {

        attempts--;

        document.getElementById("attempts").textContent = attempts;

        if (attempts === 0) {

            message.textContent =
                "انتهت المحاولات! الكلمة هي: " + currentWord.word;

            document.getElementById("guess").disabled = true;

        } else {

            message.textContent =
                "إجابة خاطئة! باقي " + attempts + " محاولات.";

        }
    }
}

// تشغيل اللعبة عند فتح الصفحة
newWord();

// التخمين باستخدام زر Enter
document.getElementById("guess").addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        checkGuess();
    }
});
