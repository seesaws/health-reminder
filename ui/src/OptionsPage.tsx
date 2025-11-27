// src/OptionsPage.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Snackbar,
  Alert,
  Container,
  IconButton,
  Stack,
  FormControl,
  OutlinedInput,
  FormHelperText,
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const defaultReminders = [
  "水水水水水水水水水水水!!!",
  "头头头头头头头头头头头!!!",
  "手手手手手手手手手手手!!!",
  "背背背背背背背背背背背!!!"
];

const DEFAULT_MIN = 5;
const DEFAULT_MAX = 15;

// 判断字符串是否为空或仅包含空白字符
const isEmptyOrWhitespace = (str: string): boolean => {
  return str.trim().length === 0;
};

// 校验时间格式 HH:mm 且有效
const isValidTime = (time: string): boolean => {
  if (!/^\d{1,2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(':').map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
};

export default function OptionsPage() {
  const [reminders, setReminders] = useState<string[]>(defaultReminders);
  const [minMinutes, setMinMinutes] = useState<number>(DEFAULT_MIN);
  const [maxMinutes, setMaxMinutes] = useState<number>(DEFAULT_MAX);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(false);
  const [quietStart, setQuietStart] = useState<string>("23:00");
  const [quietEnd, setQuietEnd] = useState<string>("07:00");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteSnackbarOpen, setDeleteSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 加载配置
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get([
        'reminders',
        'minMinutes',
        'maxMinutes',
        'notificationsEnabled',
        'quietHoursEnabled',
        'quietStart',
        'quietEnd'
      ], (result) => {
        // reminders
        if (result.reminders) {
          try {
            const parsed = JSON.parse(result.reminders);
            if (Array.isArray(parsed)) {
              const validReminders = parsed
                .filter((item: any): item is string => typeof item === 'string')
                .filter(r => !isEmptyOrWhitespace(r));
              if (validReminders.length > 0) {
                setReminders(validReminders);
              }
            }
          } catch (e) {
            console.warn('Failed to parse reminders');
          }
        }

        // 数字
        const min = parseInt(result.minMinutes, 10) || DEFAULT_MIN;
        const max = parseInt(result.maxMinutes, 10) || DEFAULT_MAX;
        setMinMinutes(Math.max(1, Math.min(60, min)));
        setMaxMinutes(Math.max(min, Math.min(60, max)));

        // 开关
        setNotificationsEnabled(result.notificationsEnabled !== false); // 默认 true
        setQuietHoursEnabled(!!result.quietHoursEnabled);

        // 时间段
        setQuietStart(typeof result.quietStart === 'string' && isValidTime(result.quietStart) ? result.quietStart : "23:00");
        setQuietEnd(typeof result.quietEnd === 'string' && isValidTime(result.quietEnd) ? result.quietEnd : "07:00");
      });
    }
  }, []);

  const handleErrorSnackbarClose = () => setErrorSnackbarOpen(false);
  const handleCloseSnackbar = () => setSnackbarOpen(false);
  const handleCloseDeleteSnackbar = () => setDeleteSnackbarOpen(false);

  // 表单是否有效
  const isFormValid = () => {
    if (!notificationsEnabled) return true; // 如果通知关闭，其他可不填

    const hasValidReminder = reminders.some(r => !isEmptyOrWhitespace(r));
    if (!hasValidReminder) return false;

    const min = Number(minMinutes);
    const max = Number(maxMinutes);
    if (isNaN(min) || isNaN(max)) return false;

    const minInt = Math.floor(min);
    const maxInt = Math.floor(max);
    if (minInt < 1 || minInt > 60) return false;
    if (maxInt < 1 || maxInt > 60) return false;
    if (minInt > maxInt) return false;

    if (quietHoursEnabled) {
      if (!isValidTime(quietStart) || !isValidTime(quietEnd)) return false;
    }

    return true;
  };

  const handleSave = () => {
    console.log('[DEBUG] 当前配置:', {
      reminders,
      notificationsEnabled,
      quietHoursEnabled,
      quietStart,
      quietEnd,
      minMinutes,
      maxMinutes
    });

    if (!notificationsEnabled) {
      // 仅保存开关状态
      if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
        chrome.storage.sync.set({
          notificationsEnabled: false,
          quietHoursEnabled: false, // 关闭通知时，自动关闭免打扰
        }, () => {
          setSnackbarOpen(true);
        });
      } else {
        setSnackbarOpen(true);
      }
      return;
    }

    // 校验提醒内容
    const hasValidReminder = reminders.some(r => !isEmptyOrWhitespace(r));
    if (!hasValidReminder) {
      setErrorMessage('提醒内容不能为空或只包含空格！');
      setErrorSnackbarOpen(true);
      return;
    }

    // 数字校验
    let min = Number(minMinutes);
    let max = Number(maxMinutes);
    if (isNaN(min) || isNaN(max)) {
      setErrorMessage('请输入有效的数字！');
      setErrorSnackbarOpen(true);
      return;
    }
    min = Math.floor(min);
    max = Math.floor(max);
    if (min < 1 || min > 60) {
      setErrorMessage('最小间隔必须在 1～60 分钟之间！');
      setErrorSnackbarOpen(true);
      return;
    }
    if (max < 1 || max > 60) {
      setErrorMessage('最大间隔必须在 1～60 分钟之间！');
      setErrorSnackbarOpen(true);
      return;
    }
    if (min > max) {
      setErrorMessage('最小间隔不能大于最大间隔！');
      setErrorSnackbarOpen(true);
      return;
    }

    // 免打扰时间校验
    if (quietHoursEnabled) {
      if (!isValidTime(quietStart)) {
        setErrorMessage('免打扰开始时间格式错误！应为 HH:mm');
        setErrorSnackbarOpen(true);
        return;
      }
      if (!isValidTime(quietEnd)) {
        setErrorMessage('免打扰结束时间格式错误！应为 HH:mm');
        setErrorSnackbarOpen(true);
        return;
      }
    }

    // 清理数据
    const cleanedReminders = reminders.map(r => r.trim()).filter(r => r !== '');

    // 保存全部
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({
        reminders: JSON.stringify(cleanedReminders),
        minMinutes: min,
        maxMinutes: max,
        notificationsEnabled: true,
        quietHoursEnabled,
        quietStart: quietHoursEnabled ? quietStart : "23:00",
        quietEnd: quietHoursEnabled ? quietEnd : "07:00",
      }, () => {
        console.log('✅ 配置已成功保存');
        setSnackbarOpen(true);
      });
    } else {
      console.log('✅ 模拟保存');
      setSnackbarOpen(true);
    }
  };

  const addReminder = () => setReminders([...reminders, '']);
  const updateReminder = (index: number, value: string) =>
    setReminders(prev => {
      const newReminders = [...prev];
      newReminders[index] = value;
      return newReminders;
    });

  const deleteReminder = (index: number) => {
    if (reminders.length <= 1) {
      setErrorMessage('你就这么轻言放弃！！！振作起来啊！！！');
      setErrorSnackbarOpen(true);
      return;
    }
    setReminders(reminders.filter((_, i) => i !== index));
    setDeleteSnackbarOpen(true);
  };

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          自定义健康提醒
        </Typography>

        {/* 通知总开关 */}
        <FormControlLabel
          control={
            <Switch
              checked={notificationsEnabled}
              onChange={(e) => setNotificationsEnabled(e.target.checked)}
              color="primary"
            />
          }
          label={notificationsEnabled ? "🔔 通知已启用" : "🔕 通知已禁用"}
          sx={{ mb: 3 }}
        />

        {/* 仅当通知启用时显示其余设置 */}
        {notificationsEnabled && (
          <>
            {/* 提醒列表 */}
            <Stack spacing={2} sx={{ mb: 3 }}>
              {reminders.map((text, index) => (
                <Box key={index} display="flex" gap={1}>
                  <TextField
                    fullWidth
                    size="small"
                    value={text}
                    onChange={(e) => updateReminder(index, e.target.value)}
                    placeholder={`提醒 ${index + 1}`}
                    inputProps={{ maxLength: 100 }}
                  />
                  <IconButton
                    onClick={() => deleteReminder(index)}
                    color="error"
                    disabled={reminders.length <= 1}
                    size="small"
                    aria-label="删除"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            </Stack>

            <Button variant="outlined" size="small" onClick={addReminder} sx={{ mb: 3 }}>
              + 添加提醒
            </Button>

            {/* 时间范围设置 */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" fontWeight="medium" gutterBottom>
                随机提醒间隔（分钟）
              </Typography>
              <Box display="flex" alignItems="center" gap={1}>
                <FormControl size="small">
                  <OutlinedInput
                    type="number"
                    value={minMinutes}
                    onChange={(e) => setMinMinutes(Number(e.target.value))}
                    inputProps={{ min: 1, max: 60, style: { width: 80 } }}
                  />
                  <FormHelperText>最小</FormHelperText>
                </FormControl>
                <Typography>～</Typography>
                <FormControl size="small">
                  <OutlinedInput
                    type="number"
                    value={maxMinutes}
                    onChange={(e) => setMaxMinutes(Number(e.target.value))}
                    inputProps={{ min: 1, max: 60, style: { width: 80 } }}
                  />
                  <FormHelperText>最大</FormHelperText>
                </FormControl>
                <Typography sx={{ ml: 1 }}>分钟</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                实际间隔将在 {minMinutes}～{maxMinutes} 分钟之间随机选择
              </Typography>
            </Box>

            {/* 免打扰设置 */}
            <Box sx={{ mb: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={quietHoursEnabled}
                    onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                    color="secondary"
                  />
                }
                label={quietHoursEnabled ? "🌙 免打扰已启用" : "🌙 免打扰已关闭"}
              />
              {quietHoursEnabled && (
                <Box sx={{ mt: 1, pl: 4 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    在以下时间段内不会发送提醒：
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <TextField
                      size="small"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      placeholder="23:00"
                      inputProps={{ maxLength: 5 }}
                      error={!isValidTime(quietStart) && quietStart !== ''}
                      helperText={!isValidTime(quietStart) && quietStart !== '' ? "格式: HH:mm" : ""}
                    />
                    <Typography>至</Typography>
                    <TextField
                      size="small"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      placeholder="07:00"
                      inputProps={{ maxLength: 5 }}
                      error={!isValidTime(quietEnd) && quietEnd !== ''}
                      helperText={!isValidTime(quietEnd) && quietEnd !== '' ? "格式: HH:mm" : ""}
                    />
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}

        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
          fullWidth
          disabled={!isFormValid()}
        >
          保存设置
        </Button>
      </Paper>

      {/* Snackbars */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ✅ 设置已保存！忙去吧！
        </Alert>
      </Snackbar>

      <Snackbar
        open={deleteSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseDeleteSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseDeleteSnackbar} severity="info" sx={{ width: '100%' }}>
          🗑️ 你就这么轻言放弃！！！振作起来啊！！！
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleErrorSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleErrorSnackbarClose} severity="error" sx={{ width: '100%' }}>
          ❌ {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}