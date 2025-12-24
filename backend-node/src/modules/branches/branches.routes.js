// src/modules/branches/branches.routes.js
const express = require('express');
const {
  listBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
} = require('./branches.controller');

const router = express.Router();

// GET /api/branches?merchant_id=1
router.get('/', listBranches);

// GET /api/branches/:id
router.get('/:id', getBranch);

// POST /api/branches
router.post('/', createBranch);

// PUT /api/branches/:id
router.put('/:id', updateBranch);

// DELETE /api/branches/:id  (soft delete)
router.delete('/:id', deleteBranch);

module.exports = router;
