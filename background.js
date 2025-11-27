// background.js

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getSettings() {
    const result = await chrome.storage.sync.get([
        'notificationsEnabled',   // 对应 OptionsPage 中的开关
        'reminders',
        'minMinutes',
        'maxMinutes',
        'quietHoursEnabled',      // 是否启用免打扰
        'quietStart',             // 如 "23:00"
        'quietEnd'                // 如 "07:00"
    ]);

    // 默认值
    const enabled = result.notificationsEnabled !== false; // 默认 true
    const quietHoursEnabled = !!result.quietHoursEnabled;

    let reminders = ["水水水!!!", "头头头!!!", "手手手!!!", "背背背!!!"];
    if (result.reminders) {
        try {
            const parsed = JSON.parse(result.reminders);
            if (Array.isArray(parsed) && parsed.length > 0) {
                reminders = parsed.filter(r => typeof r === 'string' && r.trim() !== '');
                if (reminders.length === 0) reminders = ["坚持住！！！"];
            }
        } catch (e) {
            console.warn('Failed to parse reminders, using defaults');
        }
    }

    let min = Math.max(1, parseInt(result.minMinutes, 10) || 5);
    let max = Math.max(min, parseInt(result.maxMinutes, 10) || 15);

    let quietStart = "23:00";
    let quietEnd = "07:00";
    if (typeof result.quietStart === 'string') quietStart = result.quietStart;
    if (typeof result.quietEnd === 'string') quietEnd = result.quietEnd;

    return {
        enabled,
        reminders,
        min,
        max,
        quietHoursEnabled,
        quietStart,
        quietEnd
    };
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
        // 同一天区间，例如 09:00 - 18:00
        return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
        // 跨天区间，例如 23:00 - 07:00
        return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
}

// 调度下一次提醒 alarm
async function scheduleNextAlarm() {
    const settings = await getSettings();

    // 清除旧的 alarm
    await chrome.alarms.clear('healthReminder');

    if (!settings.enabled) {
        console.log('🔕 健康提醒已关闭，不再调度');
        return;
    }

    // 即使在免打扰期间，也按原计划调度（确保非免打扰时段能及时恢复）
    const randomMinutes = getRandomInt(settings.min, settings.max);
    chrome.alarms.create('healthReminder', {
        delayInMinutes: randomMinutes
    });

    console.log(`✅ 下次提醒将在 ${randomMinutes} 分钟后尝试触发`);
}

// 判断当前是否应该发送通知
async function shouldNotifyNow() {
    const settings = await getSettings();

    if (!settings.enabled) {
        console.log('🔕 提醒已关闭，跳过通知');
        return false;
    }

    if (settings.quietHoursEnabled && isInQuietHours(settings.quietStart, settings.quietEnd)) {
        console.log('🌙 当前处于免打扰时段，跳过通知');
        return false;
    }

    return true;
}

// Alarm 触发回调
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name !== 'healthReminder') return;

    const canNotify = await shouldNotifyNow();
    if (!canNotify) {
        // 即使跳过，也要重新调度下一次（避免停止）
        scheduleNextAlarm();
        return;
    }

    // 添加 0~59 秒随机延迟，避免整点轰炸
    const extraDelaySec = Math.floor(Math.random() * 60);
    setTimeout(async () => {
        const { reminders } = await getSettings();
        const message = reminders[Math.floor(Math.random() * reminders.length)] || '该活动啦！';

        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '看到了吗!',
            message: message,
            priority: 1,
        });

        // 调度下一次提醒
        scheduleNextAlarm();
    }, extraDelaySec * 1000);
});

// 初始化
(async () => {
    try {
        console.log('🔄 健康提醒扩展已启动...');
        await scheduleNextAlarm(); // ✅ 加上 await
    } catch (err) {
        console.error('💥 Background 初始化失败:', err);
    }
})();

// 监听设置变更（storage.sync）
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        const watchedKeys = [
            'notificationsEnabled',
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