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

export default function OptionsPage() {
  const [reminders, setReminders] = useState<string[]>(defaultReminders);
  const [minMinutes, setMinMinutes] = useState<number>(DEFAULT_MIN);
  const [maxMinutes, setMaxMinutes] = useState<number>(DEFAULT_MAX);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteSnackbarOpen, setDeleteSnackbarOpen] = useState(false);
  const [errorSnackbarOpen, setErrorSnackbarOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 加载配置
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(['reminders', 'minMinutes', 'maxMinutes'], (result) => {
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

        const min = parseInt(result.minMinutes, 10) || DEFAULT_MIN;
        const max = parseInt(result.maxMinutes, 10) || DEFAULT_MAX;
        setMinMinutes(Math.max(1, Math.min(60, min)));
        setMaxMinutes(Math.max(min, Math.min(60, max)));
      });
    }
  }, []);

  const handleErrorSnackbarClose = () => setErrorSnackbarOpen(false);
  const handleCloseSnackbar = () => setSnackbarOpen(false);
  const handleCloseDeleteSnackbar = () => setDeleteSnackbarOpen(false);

  // 表单是否有效（用于禁用按钮）
  const isFormValid = () => {
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

    return true;
  };

  const handleSave = () => {
    // 🔍 调试日志：查看当前输入内容
    console.log('[DEBUG] 当前 reminders:', reminders);

    // ✅ 核心校验：是否有至少一条非空白提醒
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

    // 清理数据：去除首尾空格，过滤空白项
    const cleanedReminders = reminders
      .map(r => r.trim())
      .filter(r => r !== '');

    // 保存
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({
        reminders: JSON.stringify(cleanedReminders),
        minMinutes: min,
        maxMinutes: max,
      }, () => {
        console.log('✅ 配置已成功保存到 storage');
        setSnackbarOpen(true);
      });
    } else {
      // 开发环境模拟
      console.log('✅ 模拟保存:', { reminders: cleanedReminders, min, max });
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

        {/* 时间设置 */}
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

        {/* 保存按钮 - 无效时禁用 */}
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

      {/* 成功提示 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ✅ 哎哟喂，设置好了快去忙你的吧！
        </Alert>
      </Snackbar>

      {/* 删除提示 */}
      <Snackbar
        open={deleteSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseDeleteSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseDeleteSnackbar} severity="warning" sx={{ width: '100%' }}>
          🗑️ 你就这么轻言放弃！！！振作起来啊！！！
        </Alert>
      </Snackbar>

      {/* 错误提示 */}
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