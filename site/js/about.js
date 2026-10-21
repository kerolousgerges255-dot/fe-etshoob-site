import { session, renderChrome, SITE } from "./app.js";
const s = await session();
renderChrome("about", s);

// لا يوجد محتوى ديناميكي في هذه الصفحة — كل شيء في HTML