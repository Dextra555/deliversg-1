var mongoose = require('mongoose');
var schema = mongoose.Schema;
var autoIncrement = require('mongoose-auto-increment');
var review = new schema({
    unique_id: Number,
    user_rating_to_provider: {type: Number, default: 0},
    user_review_to_provider: {type: String, default: ""},
    user_rating_to_store:    {type: Number, default: 0},
    user_review_to_store:    {type: String, default: ""},
    provider_rating_to_user: {type: Number, default: 0},
    provider_review_to_user: {type: String, default: ""},
    provider_rating_to_store:{type: Number, default: 0},
    provider_review_to_store:{type: String, default: ""},
    store_rating_to_provider:{type: Number, default: 0},
    store_review_to_provider:{type: String, default: ""},
    store_rating_to_user:    {type: Number, default: 0},
    store_review_to_user:    {type: String, default: ""},
    order_id:                {type: schema.Types.ObjectId},
    order_unique_id:         {type: Number, default: 0},

    user_id:                 {type: schema.Types.ObjectId},
    store_id:                {type: schema.Types.ObjectId},
    provider_id:             {type: schema.Types.ObjectId},

    number_of_users_like_store_comment: {type: Number, default: 0},
    number_of_users_dislike_store_comment: {type: Number, default: 0},
    id_of_users_like_store_comment: [{type: schema.Types.ObjectId}],
    id_of_users_dislike_store_comment: [{type: schema.Types.ObjectId}],

    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }

}, {
    strict: true,
    timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
    }
});

review.index({order_id: 1}, {background: true});
review.index({provider_id: 1}, {background: true});
review.index({store_id: 1}, {background: true});
review.index({user_id: 1}, {background: true});
review.index({order_id: 1}, {background: true});

review.plugin(autoIncrement.plugin, {model: 'review', field: 'unique_id', startAt: 1, incrementBy: 1});
module.exports = mongoose.model('review', review);