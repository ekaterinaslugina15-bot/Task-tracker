const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// GET все задачи
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status && status !== 'all' ? { status } : {};
    const tasks = await Task.find(filter).sort({ date: 1 });
    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка получения задач' });
  }
});

// POST создать задачу
router.post('/', async (req, res) => {
  try {
    const { title, description, owner, date, status } = req.body;
    
    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Название задачи обязательно' });
    }
    
    const task = new Task({
      title: title.trim(),
      description: description || '',
      owner: owner || 'Не указан',
      date: date || '',
      status: status || 'today'
    });
    
    await task.save();
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка создания задачи' });
  }
});

// PUT обновить задачу
router.put('/:id', async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    
    const { title, description, owner, date, status } = req.body;
    task.title = title.trim();
    task.description = description || '';
    task.owner = owner || 'Не указан';
    task.date = date || '';
    task.status = status || task.status;
    
    await task.save();
    res.json({ success: true, data: task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка обновления задачи' });
  }
});

// DELETE удалить задачу
router.delete('/:id', async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ error: 'Задача не найдена' });
    res.json({ success: true, message: 'Задача удалена' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка удаления задачи' });
  }
});

module.exports = router;