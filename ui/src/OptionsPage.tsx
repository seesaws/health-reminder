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
  InputLabel,
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

export default function OptionsPage() {
  const [reminders, setReminders] = useState<string[]>(defaultReminders);
  const [minMinutes, setMinMinutes] = useState<number>(DEFAULT_MIN);
  const [maxMinutes, setMaxMinutes] = useState<number>(DEFAULT_MAX);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [deleteSnackbarOpen, setDeleteSnackbarOpen] = useState(false);


  // 从 storage 加载
  useEffect(() => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(['reminders', 'minMinutes', 'maxMinutes'], (result) => {
        // 加载提醒
        if (result.reminders) {
          try {
            const parsed = JSON.parse(result.reminders);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setReminders(parsed);
            }
          } catch (e) {
            console.warn('Invalid reminders');
          }
        }

        // 加载时间范围
        const min = parseInt(result.minMinutes, 10) || DEFAULT_MIN;
        const max = parseInt(result.maxMinutes, 10) || DEFAULT_MAX;
        setMinMinutes(Math.max(1, Math.min(60, min)));
        setMaxMinutes(Math.max(min, Math.min(60, max)));
      });
    }
  }, []);

  const handleSave = () => {
    // 校验提醒
    const cleanedReminders = reminders.map(s => s.trim()).filter(s => s);
    if (cleanedReminders.length === 0) {
      alert('你倒是写点啥啊！！！');
      return;
    }

    // 校验时间范围
    let min = Math.floor(Number(minMinutes));
    let max = Math.floor(Number(maxMinutes));

    if (isNaN(min) || isNaN(max)) {
      alert('请输入有效的数字！');
      return;
    }

    min = Math.max(1, Math.min(60, min));
    max = Math.max(min, Math.min(60, max));

    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.set({
        reminders: JSON.stringify(cleanedReminders),
        minMinutes: min,
        maxMinutes: max,
      }, () => {
        console.log('✅ 配置已保存');
        setSnackbarOpen(true);
      });
    } else {
      console.warn('非扩展环境，模拟保存');
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
      console.warn('无法删除最后一个提醒');
      return;
    }

    setReminders(reminders.filter((_, i) => i !== index));
    setDeleteSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);
  const handleCloseDeleteSnackbar = () => setDeleteSnackbarOpen(false);


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

        <Button variant="contained" color="primary" onClick={handleSave} fullWidth>
          保存设置
        </Button>
      </Paper>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={2000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          ✅ 设置已保存！
        </Alert>
      </Snackbar>

      <Snackbar
        open={deleteSnackbarOpen}
        autoHideDuration={3000}
        onClose={handleCloseDeleteSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseDeleteSnackbar} severity="info" sx={{ width: '100%' }}>
          你就这么轻言放弃！！！振作起来啊！！！
        </Alert>
      </Snackbar>
    </Container>
  );
}