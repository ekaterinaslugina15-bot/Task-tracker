const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  owner: { type: String, default: 'Не указан' },
  date: { type: String, default: '' },
  status: { type: String, enum: ['overdue', 'inprogress', 'today', 'completed'], default: 'today' },
  createdAt: { type: Date, default: Date.now }
}, { 
  collection: 'config'  
});

module.exports = mongoose.model('Task', taskSchema);

// Схемка MongoDB с задачами 