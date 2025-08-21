import User from '../models/user.model.js';
import University from '../models/university.model.js';

// Get current user's shortlist
export const getShortlist = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ shortlist: user.shortlist || [] });
  } catch (err) {
    console.error('getShortlist error', err);
    res.status(500).json({ message: 'Failed to fetch shortlist' });
  }
};

// Add a university to shortlist
export const addToShortlist = async (req, res) => {
  try {
    const { universityId, matchScore } = req.body;
    if (!universityId) return res.status(400).json({ message: 'universityId required' });
    const uni = await University.findById(universityId).lean();
    if (!uni) return res.status(404).json({ message: 'University not found' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Prevent duplicates
    const exists = user.shortlist?.some(item => item.universityId.toString() === universityId);
    if (exists) return res.status(200).json({ message: 'Already in shortlist', shortlist: user.shortlist });

    user.shortlist.push({
      universityId: uni._id,
      name: uni.name,
      location: [uni.location?.city, uni.location?.state, uni.location?.country].filter(Boolean).join(', '),
      matchScore: matchScore ?? null
    });
    await user.save();
    res.status(201).json({ message: 'Added to shortlist', shortlist: user.shortlist });
  } catch (err) {
    console.error('addToShortlist error', err);
    res.status(500).json({ message: 'Failed to add to shortlist' });
  }
};

// Remove from shortlist by shortlist item id
export const removeFromShortlist = async (req, res) => {
  try {
    const { id } = req.params; // shortlist subdocument _id
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const before = user.shortlist.length;
    user.shortlist = user.shortlist.filter(item => item._id.toString() !== id);
    if (user.shortlist.length === before) return res.status(404).json({ message: 'Shortlist item not found' });
    await user.save();
    res.json({ message: 'Removed from shortlist', shortlist: user.shortlist });
  } catch (err) {
    console.error('removeFromShortlist error', err);
    res.status(500).json({ message: 'Failed to remove from shortlist' });
  }
};
