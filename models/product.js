const mongoose = require('mongoose')

const url = process.env.MONGODB_URI

console.log('connecting to', url)

mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false, useCreateIndex: true })
  .then(result => {
    console.log('connected to MongoDB')
  })
  .catch((error) => {
    console.log('error connecting to MongoDB:', error.message)
  })

  const productSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true
  },
    description: {
        type: String,
        required: true
    },
    price: {
      type: Number,
      required: true
  },  
  version:{
    type: String,
    required: true,
  },
  date_posted:{
    type: Date,
    default: Date.now
  },
  quantity:{
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: true
  }
})

productSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
  }
})

module.exports = mongoose.model('product',productSchema)