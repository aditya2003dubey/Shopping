// const listing = require("./modals/listing");
// const review = require("./models/review");
// const {reviewSchema} = require("./schema.js");
const ExpressError = require("./utils/ExpressError.js");

module.exports.isLoggedIn = (req,res,next) =>{
    if(!req.isAuthenticated()){
        req.session.redirectUrl = req.originalUrl;
        req.flash("error","you must be logged in to create listing!");
        return res.redirect("/login");
        }
        next();
}
module.exports.saveRedirecturl =(req,res,next) =>{
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

// module.exports.isOwner =async (req,res,next) =>{
//     let {id} = req.params;
//     let Listing = await listing.findById(id);
//     if( !Listing.owner.equals(res.locals.currUser._id)){
//       req.flash("error","you are not the owner of listing");
//       return res.redirect(`/listing/${id}`);
//     }
//     next();
// }

// module.exports.isReviewAuthor =async (req,res,next) =>{
//     let {id ,reviewId} = req.params;
//     let Review = await review.findById(reviewId);
//     if( !Review.author.equals(res.locals.currUser._id)){
//       req.flash("error","you are not the author of review");
//       return res.redirect(`/listing/${id}`);
//     }
//     next();
// }

// module.exports.validateListing = (req,res,next) =>{
//     let {error} = listingSchema.validate(req.body);
//     if(error){
//         let errMsg = error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400,errMsg);
//     }
//     else{
//         next();
//     }
// };

// module.exports.validateReview = (req,res,next) =>{
//     let {error} = reviewSchema.validate(req.body);
//     if(error){
//         let errMsg = error.details.map((el) => el.message).join(",");
//         throw new ExpressError(400,errMsg);
//     }
//     else{
//         next();
//     }
// };