# مصدر الـ skills المثبّتة

اتفحصت كلها بالمراجعة اليدوية وبأداة `skill-security-auditor` قبل التثبيت (كلها نصوص ومعظمها من غير سكريبتات).

## المجموعة 1: alirezarezvani/claude-skills (رخصة MIT، `LICENSE-alirezarezvani-claude-skills.txt`)
| Skill | بتساعد في | تعديلات محلية |
|---|---|---|
| senior-backend | الصلاحيات والمصادقة وتصميم البيانات | لا |
| senior-devops | النشر الآمن والمراقبة | لا |
| senior-security | نمذجة التهديدات وفحص الأسرار | سطرين: `__import__('datetime')` اتبدّل بـ `import` عادي |
| ci-cd-pipeline-builder | مسارات GitHub Actions | لا |
| env-secrets-manager | منع تسريب الأسرار | لا |

الأداة بتعلّم `env-secrets-manager` بـ FAIL بسبب جملة نصيحة (سطر 84: "متقراش الأسرار من ملفات .env في الإنتاج")، وده تحذير غلط. وتحذيرين WARN على أسطر `pip install` جوه قوالب بتتولّد.

## المجموعة 2: Jeffallan/claude-skills (رخصة MIT، `LICENSE-jeffallan-claude-skills.txt`، دليلها https://jeffallan.github.io/claude-skills/skills-guide/)
| Skill | بتساعد في | تعديلات محلية |
|---|---|---|
| javascript-pro | جافاسكريبت حديثة (ES modules, async) | لا |
| secure-code-guardian | كتابة كود آمن ومنع ثغرات OWASP | لا |
| security-reviewer | مراجعة أمنية وتقارير بدرجات خطورة | شلنا `references/penetration-testing.md` وسطره من الجدول (الأداة علّمته: أمر `kubectl get secrets` مثال في دليل اختراق، ومالوش لازمة عندنا) |
| code-reviewer | مراجعة كود شاملة | لا |
| test-master | استراتيجية الاختبارات | لا |
| playwright-expert | اختبارات المتصفح | لا |
| debugging-wizard | تتبّع الأخطاء بمنهج | لا |
| devops-engineer | CI/CD والنشر | لا |
| fullstack-guardian | تنفيذ ميزات كاملة بأمان على كل الطبقات | لا |

## ملحوظة
الـ skills عامة (Node/Python/AWS/Kubernetes)، ومشروعنا Firebase وGitHub Pages. الـ skill الخاصة بمشروعنا `fe-etshoob-site` هي اللي بتوجّه التفاصيل. لو skill عامة اتعارضت معاها، الأولوية للخاصة.
