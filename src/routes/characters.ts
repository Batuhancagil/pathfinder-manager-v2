import express from 'express';
import { 
  createCharacter, 
  getCharacters, 
  getCharacter, 
  updateCharacter, 
  deleteCharacter 
} from '../controllers/characterController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// All character routes require authentication
router.use(authenticateToken);

router.post('/', createCharacter);
router.get('/', getCharacters);
router.get('/:id', getCharacter);
router.put('/:id', updateCharacter);
router.delete('/:id', deleteCharacter);

export default router;
