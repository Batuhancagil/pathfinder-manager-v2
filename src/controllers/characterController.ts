import { Request, Response } from 'express';
import Character from '../models/Character';

export const createCharacter = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const characterData = { ...req.body, userId };
    
    const character = new Character(characterData);
    await character.save();
    
    res.status(201).json({
      message: 'Character created successfully',
      character
    });
  } catch (error) {
    console.error('Create character error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCharacters = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const characters = await Character.find({ userId });
    
    res.json({ characters });
  } catch (error) {
    console.error('Get characters error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getCharacter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    
    const character = await Character.findOne({ _id: id, userId });
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    res.json({ character });
  } catch (error) {
    console.error('Get character error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateCharacter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    
    const character = await Character.findOneAndUpdate(
      { _id: id, userId },
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    res.json({
      message: 'Character updated successfully',
      character
    });
  } catch (error) {
    console.error('Update character error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCharacter = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user._id;
    
    const character = await Character.findOneAndDelete({ _id: id, userId });
    if (!character) {
      return res.status(404).json({ message: 'Character not found' });
    }
    
    res.json({ message: 'Character deleted successfully' });
  } catch (error) {
    console.error('Delete character error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
