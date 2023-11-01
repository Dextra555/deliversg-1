let mongoose = require('mongoose')
let autoIncrement = require('mongoose-auto-increment');
let schema = mongoose.Schema;
let storePageSeoTags = new schema({
    seoTitleTag: {type: String, default: ''},
    metaRobotsFollow: { type: Boolean, default: false},
    metaRobotsIndex: { type: Boolean, default: false},
    seoDescription: { type: String, default: '' },
    seoConicalUrl: { type: String, default: '' },
    menuTitle: { type: Array, default: [] },
    menuTitleHtmlTag: { type: String, default: 'h6' },
    addressTitle: { type: Array, default: [] },
    addressTitleHtmlTag: { type: String, default: 'h6' },
    hoursTitle: { type: Array, default: [] },
    hoursTitleHtmlTag: { type: String, default: 'h6' },
    ogUrl: { type: String, default: '' },
    ogTitle: { type: Array, default: [] },
    ogType: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    ogDescription: { type: Array, default: [] },
    twitterCard: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    twitterTitle: { type: Array, default: [] },
    twitterImage: { type: String, default: '' },
    twitterDescription: { type: Array, default: [] },
    ogUrlIsManual: { type: Boolean, default: false },
    ogImageUrlIsManual: { type: Boolean, default: false },
});
storePageSeoTags.plugin(autoIncrement.plugin, {model: 'storePageSeoTags', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('storePageSeoTags',storePageSeoTags);