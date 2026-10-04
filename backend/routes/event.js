import express from 'express';
import { protect, admin } from '../middleware/auth.js';
import {
	getAllEvents,
	geteventbyid,
	createevent,
	updateevent,
	deleteevent,
} from '../controllers/eventcontroller.js';

const router = express.Router();

// get all events
router.get('/', getAllEvents);

// get event by id
router.get('/:id', geteventbyid);

// create event (admin only)
router.post('/', protect, admin, createevent);

// update event (admin only)
router.put('/:id', protect, admin, updateevent);

// delete events (admin only)
router.delete('/:id', protect, admin, deleteevent);

export default router;