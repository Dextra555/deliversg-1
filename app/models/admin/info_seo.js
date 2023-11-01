let mongoose = require('mongoose')
let autoIncrement = require('mongoose-auto-increment');
let schema = mongoose.Schema;
let infoPageSeoTags = new schema({
    seoTitleTag: {type: String, default: ''},
    metaRobotsFollow: { type: Boolean, default: false},
    metaRobotsIndex: { type: Boolean, default: false},
    seoDescription: { type: String, default: '' },
    seoConicalUrl: { type: String, default: '' },
    homeTitle: {type: Array, default: []},
    homeTitleHtmlTag: { type: String, default: 'h6' },
    homeDescription: { type: Array, default: [] },
    homeDescriptionHtmlTag: { type: String, default: 'h6' },
    storeTitle: { type: Array, default: [] },
    storeTitleHtmlTag: { type: String, default: 'h6' },
    storeDescription: { type: Array, default: [] },
    storeDescriptionHtmlTag: { type: String, default: 'h6' },
    providerTitle: {type: Array, default: []},
    providerTitleHtmlTag: { type: String, default: 'h6' },
    providerDescription: { type: Array, default: [] },
    providerDescriptionHtmlTag: { type: String, default: 'h6' },
    ogUrl: { type: String, default: '' },
    ogTitle: { type: Array, default: [] },
    ogType: { type: String, default: '' },
    ogImage: { type: String, default: '' },
    ogDescription: { type: Array, default: [] },
    ogUrlIsManual: { type: Boolean, default: false },
    twitterCard: { type: String, default: '' },
    twitterUrl: { type: String, default: '' },
    twitterTitle: { type: Array, default: [] },
    twitterImage: { type: String, default: '' },
    twitterDescription: { type: Array, default: [] }
});
infoPageSeoTags.plugin(autoIncrement.plugin, {model: 'infoPageSeoTags', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('infoPageSeoTags',infoPageSeoTags);