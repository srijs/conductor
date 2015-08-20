module.exports = {

  remote: {
    //host: 'http://172.17.42.1',
    host: 'http://localhost',
    port: 2375
  },

  images: {
    workers: {
      'abc': '9fb80427f748',
    },
    controller: 'c2981d0ed403'
  },

  constraints: {
    memory: 512,
    memorySwap: 512
  }

};
