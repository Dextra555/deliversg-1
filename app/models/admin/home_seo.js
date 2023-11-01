let mongoose = require('mongoose')
let autoIncrement = require('mongoose-auto-increment');
let schema = mongoose.Schema;
let homePageSeoTags = new schema({
    seoTitleTag: {type: String, default: ''},
    metaRobotsFollow: { type: Boolean, default: false},
    metaRobotsIndex: { type: Boolean, default: false},
    seoDescription: { type: String, default: '' },
    seoConicalUrl: { type: String, default: '' },
    deliveryListTitle: { type: Array, default: [] },
    deliveryListHtmlTag: { type: String, default: 'h6' },
    adsTitle: { type: Array, default: [] },
    advertiseHtmlTag: { type: String, default: 'h6' },
    nearStoreList: { type: Array, default: [] },
    nearStoreListHtmlTag: { type: String, default: 'h6' },
    offerList: { type: Array, default: [] },
    offerTitleHtmlTag: {type: String, default: 'h6'},
    ogUrl: { type: String, default: '' },
    ogTitle: { type: Array, default: [] },
    ogType: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    ogDescription: { type: Array, default: [] },
    twitterCard: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    twitterTitle: { type: Array, default: [] },
    twitterImage: { type: String, default: '' },
    twitterDescription: { type: Array, default: [] }
});
homePageSeoTags.plugin(autoIncrement.plugin, {model: 'homePageSeoTags', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('homePageSeoTags',homePageSeoTags);