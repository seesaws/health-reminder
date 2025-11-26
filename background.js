// background.js

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function getSettings() {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['reminders', 'minMinutes', 'maxMinutes'], (result) => {
            let reminders = [
                "水水水水水水水水水水水!!!",
                "头头头头头头头头头头头!!!",
                "手手手手手手手手手手手!!!",
                "背背背背背背背背背背背!!!"
            ];
            let min = 5;
            let max = 15;

            if (result.reminders) {
                try {
                    const parsed = JSON.parse(result.reminders);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        reminders = parsed;
                    }
                } catch (e) {
                    console.warn('Invalid reminders format');
                }
            }

            min = Math.max(1, parseInt(result.minMinutes, 10) || 5);
            max = Math.max(min, parseInt(result.maxMinutes, 10) || 15);

            resolve({ reminders, min, max });
        });
    });
}

// 创建下一次提醒（使用 alarms）
async function scheduleNextAlarm() {
    const { min, max } = await getSettings();
    const randomMinutes = getRandomInt(min, max);

    // 设置 alarm，延迟 randomMinutes 分钟
    chrome.alarms.create('healthReminder', {
        delayInMinutes: randomMinutes
    });

    console.log(`⏰ 下次提醒将在 ${randomMinutes} 分钟后触发`);
}

// 监听 alarm 触发
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name === 'healthReminder') {
        const { reminders } = await getSettings();
        const message = reminders[Math.floor(Math.random() * reminders.length)];

        // 显示通知
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: '健康小助手 💪',
            message: message,
            priority: 1,
        });

        // 安排下一次
        scheduleNextAlarm();
    }
});

// 启动时安排第一次提醒
scheduleNextAlarm();

// 监听设置变更
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync' && (changes.reminders || changes.minMinutes || changes.maxMinutes)) {
        console.log('🔄 设置已更新，重新安排提醒...');
        // 先清除旧 alarm
        chrome.alarms.clear('healthReminder');
        // 再安排新的
        scheduleNextAlarm();
    }
});