const defaultReminders = [
    "水水水水水水水水水水水!!!",
    "头头头头头头头头头头头!!!",
    "手手手手手手手手手手手!!!",
    "背背背背背背背背背背背!!!"
].join('\n');

document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.getElementById('reminders');
    const status = document.getElementById('status');

    // 从 storage 加载已有设置，或使用默认值
    chrome.storage.sync.get(['reminders'], (result) => {
        textarea.value = result.reminders || defaultReminders;
    });

    document.getElementById('save').addEventListener('click', () => {
        const value = textarea.value.trim();
        if (!value) {
            alert('请至少输入一条提醒内容！');
            return;
        }
        const reminders = value.split('\n').map(s => s.trim()).filter(s => s);
        if (reminders.length === 0) {
            alert('提醒内容不能为空！');
            return;
        }

        chrome.storage.sync.set({ reminders: reminders.join('\n') }, () => {
            status.style.display = 'block';
            setTimeout(() => status.style.display = 'none', 2000);
        });
    });
});