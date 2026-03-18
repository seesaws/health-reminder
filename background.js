// background.js

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getSettings() {
    const result = await chrome.storage.sync.get([
        'notificationsEnabled',
        'reminders',
        'minMinutes',
        'maxMinutes',
        'quietHoursEnabled',
        'quietStart',
        'quietEnd'
    ]);

    const enabled = result.notificationsEnabled !== false;
    const quietHoursEnabled = !!result.quietHoursEnabled;

    const defaultReminders = ["水水水!!!", "头头头!!!", "手手手!!!", "背背背!!!"];
    let reminders = defaultReminders;
    if (Array.isArray(result.reminders) && result.reminders.length > 0) {
        const filtered = result.reminders.filter(r => typeof r === 'string' && r.trim() !== '');
        if (filtered.length > 0) reminders = filtered;
    }

    let min = Math.max(1, parseInt(result.minMinutes, 10) || 5);
    let max = Math.max(min, parseInt(result.maxMinutes, 10) || 15);

    const quietStart = typeof result.quietStart === 'string' ? result.quietStart : "23:00";
    const quietEnd = typeof result.quietEnd === 'string' ? result.quietEnd : "07:00";

    return { enabled, reminders, min, max, quietHoursEnabled, quietStart, quietEnd };
}

// 判断当前是否在免打扰时段（支持跨天）
function isInQuietHours(quietStart, quietEnd) {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    const [startH, startM] = quietStart.split(':').map(Number);
    const [endH, endM] = quietEnd.split(':').map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
}

// 调度下一次提醒 alarm
async function scheduleNextAlarm() {
    const settings = await getSettings();

    await chrome.alarms.clear('healthReminder');

    if (!settings.enabled) {
        console.log('🔕 健康提醒已关闭，不再调度');
        return;
    }

    const randomMinutes = getRandomInt(settings.min, settings.max);
    chrome.alarms.create('healthReminder', { delayInMinutes: randomMinutes });
    console.log(`✅ 下次提醒将在 ${randomMinutes} 分钟后尝试触发`);
}

// Alarm 触发回调
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'healthReminder') return;

    const settings = await getSettings();

    if (!settings.enabled) {
        console.log('🔕 提醒已关闭，跳过通知');
        scheduleNextAlarm();
        return;
    }

    if (settings.quietHoursEnabled && isInQuietHours(settings.quietStart, settings.quietEnd)) {
        console.log('🌙 当前处于免打扰时段，跳过通知');
        scheduleNextAlarm();
        return;
    }

    // 添加 0~59 秒随机延迟，避免整点轰炸
    const extraDelaySec = Math.floor(Math.random() * 60);
    setTimeout(() => {
        const message = settings.reminders[Math.floor(Math.random() * settings.reminders.length)] || '该活动啦！';
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '看到了吗!',
            message: message,
            priority: 1,
        });
        scheduleNextAlarm();
    }, extraDelaySec * 1000);
});

// 首次安装时初始化默认设置
chrome.runtime.onInstalled.addListener(({ reason }) => {
    if (reason === 'install') {
        chrome.storage.sync.set({
            notificationsEnabled: true,
            reminders: ["水水水!!!", "头头头!!!", "手手手!!!", "背背背!!!"],
            minMinutes: 5,
            maxMinutes: 15,
            quietHoursEnabled: false,
            quietStart: "23:00",
            quietEnd: "07:00",
        });
        console.log('🎉 健康提醒扩展已安装，默认设置已写入');
    }
    scheduleNextAlarm();
});

// 初始化（service worker 重启时）
(async () => {
    try {
        console.log('🔄 健康提醒扩展已启动...');
        await scheduleNextAlarm();
    } catch (err) {
        console.error('💥 Background 初始化失败:', err);
    }
})();

// 监听设置变更
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        const watchedKeys = [
            'notificationsEnabled',
            'reminders',
            'minMinutes',
            'maxMinutes',
            'quietHoursEnabled',
            'quietStart',
            'quietEnd'
        ];
        const hasRelevantChange = Object.keys(changes).some(key => watchedKeys.includes(key));
        if (hasRelevantChange) {
            console.log('⚙️ 检测到相关设置变更，重新调度提醒...');
            scheduleNextAlarm();
        }
    }
});
