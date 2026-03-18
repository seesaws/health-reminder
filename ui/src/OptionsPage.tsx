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

const isEmptyOrWhitespace = (str: string): boolean => str.trim().length === 0;

const isValidTime = (time: string): boolean => {
  if (!/^\d{1,2}:\d{2}$/.test(time)) return false;
  const [h, m] = time.split(':').map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
};

// 返回错误信息，无错误返回 null
function validate(
  notificationsEnabled: boolean,
  reminders: string[],
  minMinutes: number,
  maxMinutes: number,
  quietHoursEnabled: boolean,
  quietStart: string,
  quietEnd: string
): string | null {
  if (!notificationsEnabled) return null;

  if (!reminders.some(r => !isEmptyOrWhitespace(r))) return '提醒内容不能为空或只包含空格！';

  const min = Math.floor(Number(minMinutes));
  const max = Math.floor(Number(maxMinutes));
  if (isNaN(min) || isNaN(max)) return '请输入有效的数字！';
  if (min < 1 || min > 60) return '最小间隔必须在 1～60 分钟之间！';
  if (max < 1 || max > 60) return '最大间隔必须在 1～60 分钟之间！';
  if (min > max) return '最小间隔不能大于最大间隔！';

  if (quietHoursEnabled) {
    if (!isValidTime(quietStart)) return '免打扰开始时间格式错误！应为 HH:mm';
    if (!isValidTime(quietEnd)) return '免打扰结束时间格式错误！应为 HH:mm';
  }

  return null;
}

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
        if (Array.isArray(result.reminders)) {
          const valid = result.reminders
            .filter((item: unknown): item is string => typeof item === 'string')
            .filter(r => !isEmptyOrWhitespace(r));
          if (valid.length > 0) setReminders(valid);
        }

        const min = parseInt(result.minMinutes, 10) || DEFAULT_MIN;
        const max = parseInt(result.maxMinutes, 10) || DEFAULT_MAX;
        setMinMinutes(Math.max(1, Math.min(60, min)));
        setMaxMinutes(Math.max(min, Math.min(60, max)));

        setNotificationsEnabled(result.notificationsEnabled !== false);
        setQuietHoursEnabled(!!result.quietHoursEnabled);

        setQuietStart(typeof result.quietStart === 'string' && isValidTime(result.quietStart) ? result.quietStart : "23:00");
        setQuietEnd(typeof result.quietEnd === 'string' && isValidTime(result.quietEnd) ? result.quietEnd : "07:00");
      });
    }
  }, []);

  const handleSave = () => {
    const error = validate(notificationsEnabled, reminders, minMinutes, maxMinutes, quietHoursEnabled, quietStart, quietEnd);
    if (error) {
      setErrorMessage(error);
      setErrorSnackbarOpen(true);
      return;
    }

    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      if (!notificationsEnabled) {
        chrome.storage.sync.set({ notificationsEnabled: false, quietHoursEnabled: false }, () => {
          setSnackbarOpen(true);
        });
        return;
      }

      const cleanedReminders = reminders.map(r => r.trim()).filter(r => r !== '');
      const min = Math.floor(Number(minMinutes));
      const max = Math.floor(Number(maxMinutes));

      chrome.storage.sync.set({
        reminders: cleanedReminders,
        minMinutes: min,
        maxMinutes: max,
        notificationsEnabled: true,
        quietHoursEnabled,
        quietStart: quietHoursEnabled ? quietStart : "23:00",
        quietEnd: quietHoursEnabled ? quietEnd : "07:00",
      }, () => setSnackbarOpen(true));
    } else {
      setSnackbarOpen(true);
    }
  };

  const addReminder = () => setReminders([...reminders, '']);
  const updateReminder = (index: number, value: string) =>
    setReminders(prev => {
      const next = [...prev];
      next[index] = value;
      return next;
    });

  const deleteReminder = (index: number) => {
    if (reminders.length <= 1) {
      setErrorMessage('至少保留一条提醒内容！');
      setErrorSnackbarOpen(true);
      return;
    }
    setReminders(reminders.filter((_, i) => i !== index));
    setDeleteSnackbarOpen(true);
  };

  const isFormValid = () => validate(notificationsEnabled, reminders, minMinutes, maxMinutes, quietHoursEnabled, quietStart, quietEnd) === null;

  return (
    <Container maxWidth="sm" sx={{ py: 3 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          自定义健康提醒
        </Typography>

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

        {notificationsEnabled && (
          <>
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
                      type="time"
                      value={quietStart}
                      onChange={(e) => setQuietStart(e.target.value)}
                      inputProps={{ step: 60 }}
                    />
                    <Typography>至</Typography>
                    <TextField
                      size="small"
                      type="time"
                      value={quietEnd}
                      onChange={(e) => setQuietEnd(e.target.value)}
                      inputProps={{ step: 60 }}
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

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          ✅ 设置已保存！忙去吧！
        </Alert>
      </Snackbar>

      <Snackbar
        open={deleteSnackbarOpen}
        autoHideDuration={2000}
        onClose={() => setDeleteSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setDeleteSnackbarOpen(false)} severity="info" sx={{ width: '100%' }}>
          🗑️ 已删除该提醒
        </Alert>
      </Snackbar>

      <Snackbar
        open={errorSnackbarOpen}
        autoHideDuration={3000}
        onClose={() => setErrorSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={() => setErrorSnackbarOpen(false)} severity="error" sx={{ width: '100%' }}>
          ❌ {errorMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
}
