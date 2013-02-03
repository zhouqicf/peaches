module.exports = function(file) {
    if (process.env.PEACHES_COV) {
        file = file.replace('/lib/', '/lib-cov/');
    }
    return require(file);
};
