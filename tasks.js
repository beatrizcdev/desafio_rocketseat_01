import { Router } from 'express';
import { randomUUID } from 'crypto';
import fs from 'fs';
import { parse } from 'csv-parse';

const router = Router();
let tasks = [];

router.post('/', (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  const task = {
    id: randomUUID(),
    title,
    description,
    completed_at: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  tasks.push(task);
  return res.status(201).json(task);
});

router.get('/', (req, res) => {
  const { search } = req.query;

  const result = search
    ? tasks.filter(task => task.title.includes(search) || task.description.includes(search))
    : tasks;

  return res.json(result);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const taskIndex = tasks.findIndex(task => task.id === id);
  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  if (!title && !description) {
    return res.status(400).json({ error: 'At least one field (title or description) is required.' });
  }

  if (title) tasks[taskIndex].title = title;
  if (description) tasks[taskIndex].description = description;
  tasks[taskIndex].updated_at = new Date();

  return res.json(tasks[taskIndex]);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(task => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  tasks.splice(taskIndex, 1);
  return res.status(204).send();
});

router.patch('/:id/complete', (req, res) => {
  const { id } = req.params;
  const taskIndex = tasks.findIndex(task => task.id === id);

  if (taskIndex === -1) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const task = tasks[taskIndex];
  task.completed_at = task.completed_at ? null : new Date();
  task.updated_at = new Date();

  return res.json(task);
});

router.post('/import', (req, res) => {
  const { path } = req.body; // Ex: { "path": "./tasks.csv" }
  const parser = fs.createReadStream(path).pipe(parse({ columns: true, trim: true }));

  parser.on('data', row => {
    const { title, description } = row;
    if (title && description) {
      tasks.push({
        id: randomUUID(),
        title,
        description,
        completed_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      });
    }
  });

  parser.on('end', () => {
    return res.status(201).json({ message: 'Tasks imported successfully!' });
  });

  parser.on('error', error => {
    return res.status(500).json({ error: 'Failed to import CSV', details: error.message });
  });
});

export default router;
