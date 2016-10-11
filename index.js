var escape = require('pg-escape');
var _ = require('underscore');

function Builder() {
    var t = this;
    t.resultFields = [];
    t.tables = [];
    t.conditionsAnd = [];
    t.conditionsOr = [];
    t.groups = [];
    t.orders = [];
    t.limits = -1;
    t.finish = false;

    t.insertFields = [];
    t.insertEntries = [];
    t.insertCurrentEntry = -1;

    t.updateSetters = [];

    // SELECT
    this.select = function() {
        t.type = 'SELECT';
        t.resultFields = t.resultFields.concat(_.flatten(arguments));
        return t;
    };

    this.from = function() {
        t.tables = t.tables.concat(_.flatten(arguments));
        return t;
    };

    this.where = this.whereAnd = function() {
        t.conditionsAnd = t.conditionsAnd.concat(_.flatten(arguments));
        return t;
    };

    this.whereOr = function() {
        t.conditionsOr = t.conditionsOr.concat(_.flatten(arguments));
        return t;
    };

    this.group = function() {
        t.groups = t.groups.concat(_.flatten(arguments));
        return t;
    };

    this.order = function() {
        t.orders = t.orders.concat(_.flatten(arguments));
        return t;
    };

    this.limit = function(limit) {
        t.limits = limit;
        return t;
    };

    this.offset = function(offset) {
        t.offsets = offset;
        return t;
    };

    // INSERT
    this.insert = function() {
        t.type = 'INSERT';
        t.insertFields = t.insertFields.concat(_.flatten(_.map(_.flatten(arguments), function(arg) {
            return arg.split(/[\s]*,[\s]*/);
        })));
        return t;
    };

    this.into = function(table) {
        t.tables = [ table ];
        return t;
    };

    this.entry = function(values) {
        t.insertCurrentEntry++;
        t.insertEntries.push([]);
        if(!values || values.length <= 0) {
            values = _.map(_.range(1, t.insertFields.length + 1), function(i) { return '$' + (i * (t.insertCurrentEntry + 1)); });
        }
        return t.values(values);
    };

    this.values = function() {
        if(t.insertCurrentEntry < 0) {
            t.insertCurrentEntry++;
            t.insertEntries.push([]);
        }
        t.insertEntries[t.insertCurrentEntry] = t.insertEntries[t.insertCurrentEntry].concat(_.flatten(arguments));
        return t;
    };

    this.returning = function() {
        t.resultFields = t.resultFields.concat(_.flatten(arguments));
        return t;
    };

    // UPDATE
    this.update = function(table) {
        t.type = 'UPDATE';
        t.tables = [ table ];
        return t;
    };

    this.set = function(sets) {
        t.updateSetters = t.updateSetters.concat(_.flatten(arguments));
        return t;
    };

    // DELETE
    this.delete = this.del = function() {
        t.type = 'DELETE';
        return t;
    };

    this.end = function() {
        t.finish = true;
        return t;
    }

    function _buildConditions() {
        var hasConditionsAnd = t.conditionsAnd.length > 0;
        var hasConditionsOr = t.conditionsOr.length > 0;
        var sql = '';
        if(hasConditionsAnd || hasConditionsOr) {
            sql += ' WHERE ';
            
            if(hasConditionsAnd) {
                sql += t.conditionsAnd.join(' AND ');
            }

            if(hasConditionsOr) {
                sql += (hasConditionsAnd ? ' AND ' : '') + '(' + t.conditionsOr.join(' OR ') + ')';
            }
        }
        return sql;
    }

    function _buildSelect() {
        if(t.resultFields.length <= 0) {
            t.resultFields = ['*'];
        }

        // basic query
        var query = 'SELECT ' + t.resultFields.join(',') + ' FROM ' + t.tables.join(',');
    
        // conditions; WHERE
        query += _buildConditions();
        
        if(t.groups.length > 0) {
            query += ' GROUP BY ' + t.groups.join(',');
        }

        if(t.orders.length > 0) {
            query += ' ORDER BY ' + escape.string(t.orders.join(','));
        }  
        
        if(t.limits >= 0) {
            query += ' LIMIT ' + escape.string(t.limits);
        }

        if(t.offsets !== undefined) {
            query += ' OFFSET ' + escape.string(t.offsets);
        }
        
        return query;
    }

    function _buildInsert() {
        if(t.insertEntries.length <= 0) {
            throw "Invalid builder state! Missing at least one INSERT entry.";
        }
        
        var query = 'INSERT INTO ' + t.tables[0];
        
        if(t.insertFields.length > 0) {
            query += '(' + t.insertFields.join(',') + ')';
        }

        query += ' VALUES';

        _.each(t.insertEntries, function(entry) {
            query += ' (' +  entry.join(',') + ')'; 
        });
       
        if(t.resultFields.length > 0) {
            query += ' RETURNING ' + t.resultFields.join(',');
        }
        
        return query;
    }

    function _buildUpdate() {
        if(t.updateSetters.length <= 0) {
            throw "Invalid builder state! Missing at least one UPDATE set.";
        }
        
        var query = 'UPDATE ' + t.tables[0] + ' SET ' + t.updateSetters.join(',');

        // conditions; WHERE
        query += _buildConditions();

        if(t.resultFields.length > 0) {
            query += ' RETURNING ' + t.resultFields.join(',');
        }
        
        return query;
    }

    function _buildDelete() {
        var query = 'DELETE FROM ' + t.tables.join(',');

        // conditions; WHERE
        query += _buildConditions();

        if(t.resultFields.length > 0) {
            query += ' RETURNING ' + t.resultFields.join(',');
        }
        
        return query;
    }

    this.build = function() {
        if(_.isString(t.tables)) {
            t.tables = t.tables.split(/[\s]*,[\s]*/);
        }

        if(_.isString(t.resultFields)) {
            t.resultFields = t.resultFields.split(/[\s]*,[\s]*/);
        }

        if(_.isString(t.conditionsAnd)) {
            t.conditionsAnd = t.conditionsAnd.split(/[\s]*and[\s]*/i);
        }

        if(_.isString(t.conditionsOr)) {
            t.conditionsOr = t.conditionsOr.split(/[\s]*or[\s]*/i);
        }

        if(_.isString(t.groups)) {
            t.groups = t.groups.split(/[\s]*,[\s]*/);
        }

        if(_.isString(t.orders)) {
            t.orders = t.orders.split(/[\s]*,[\s]*/);
        }

        if(_.isString(t.insertFields)) {
            t.insertFields = t.insertFields.split(/[\s]*,[\s]*/);
        }

        for(var i=0; i<t.insertEntries.length; i++) {
            if(_.isString(t.insertEntries[i])) {
                t.insertEntries[i] = t.insertEntries[i].split(/[\s]*,[\s]*/);
            }
        }

        if(_.isString(t.updateSetters)) {
            t.updateSetters = t.updateSetters.split(/[\s]*,[\s]*/);
        }

        // validate common parameters
        if(t.tables.length <= 0) {
            throw "Invalid builder state! Missing table(s).";
        }

        var sql;

        if(t.type === 'SELECT') {
            sql = _buildSelect();
        }
        if(t.type === 'INSERT') {
            sql = _buildInsert();
        }
        if(t.type === 'UPDATE') {
            sql = _buildUpdate();
        }
        if(t.type === 'DELETE') {
            sql = _buildDelete();
        }

        if(sql) {
            return sql + (t.finish ? ';' : '');
        }

        throw 'Invalid builder state! Missing instruction type (SELECT, INSERT, UPDATE or DELETE).';
    };
}

var sql = {};

sql.builder = function() {
    return new Builder();
};

sql.select = function() {
    return new Builder().select(arguments);
};

sql.insert = function() {
    return new Builder().insert(arguments);
};

sql.update = function(table) {
    return new Builder().update(table);
};

sql.delete = sql.del = function() {
    return new Builder().delete(arguments);
};

sql.build = function(q) {
    return _.extend(new Builder(), q).build();
};

module.exports = sql;