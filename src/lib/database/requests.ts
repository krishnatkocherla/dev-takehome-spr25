import mongoose, { Schema, model, models } from 'mongoose';

const RequestSchema = new Schema({
  requestId: {
    type: Number,
    required: [true, 'ID is required'],
    unique: true,
  },
  requestorName: {
    type: String,
    required: [true, 'Requestor Name is required'],
    minlength: [3, 'Requestor Name must be at least 3 characters'],
    maxlength: [30, 'Requestor Name cannot exceed 30 characters'],
  },
  itemRequested: {
    type: String,
    required: [true, 'Item Requested is required'],
    minlength: [2, 'Item Requested must be at least 2 characters'],
    maxlength: [100, 'Item Requested cannot exceed 100 characters'],
  },
  createdDate: {
    type: Date,
    required: [true, 'Created Date is required'],
    default: Date.now,
  },
  lastEditedDate: {
    type: Date,
  },
  status: {
    type: String,
    required: [true, 'Status is required'],
    enum: ['pending', 'completed', 'approved', 'rejected'],
    default: 'pending',
  },
}, {collection: 'requests'});

const Request = model('Request', RequestSchema);

export default Request;