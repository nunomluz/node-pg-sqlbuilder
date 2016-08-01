var chai = require('chai');
var assert = chai.assert;
var expect = chai.expect;

var sql = require('../');

describe('node-sql-builder', function() {
    
    describe('select', function() {
        it('should build basic select without ending', function() {
            assert.equal(
                sql.select().from('tbl_test').build(),
                'SELECT * FROM tbl_test'
            );            
        });

        it('should build basic select with ending', function() {
            assert.equal(
                sql.select().from('tbl_test').end().build(),
                'SELECT * FROM tbl_test;'
            );            
        });

        it('should build select with custom return fields as array', function() {
            assert.equal(
                sql.select(['test_id', 'name', 'ts']).from('tbl_test').end().build(),
                'SELECT test_id,name,ts FROM tbl_test;'
            );            
        });

        it('should build select with custom return fields as args', function() {
            assert.equal(
                sql.select('test_id', 'name', 'ts').from('tbl_test').end().build(),
                'SELECT test_id,name,ts FROM tbl_test;'
            );            
        });

        it('should build select with custom return fields as string', function() {
            assert.equal(
                sql.select('test_id,name,ts').from('tbl_test').end().build(),
                'SELECT test_id,name,ts FROM tbl_test;'
            );            
        });

        it('should build select with custom return fields from multiple selects', function() {
            assert.equal(
                sql.select('test_id').select('name').select('ts').from('tbl_test').end().build(),
                'SELECT test_id,name,ts FROM tbl_test;'
            );            
        });

        it('should build select with query object', function() {
            assert.equal(
                sql.build({
                    type: 'SELECT',
                    tables: 'tbl_test',
                    resultFields: 'test_id,name,ts',
                    conditionsAnd: 'name=\'lettuce\' and test_id=1'
                }),
                'SELECT test_id,name,ts FROM tbl_test WHERE name=\'lettuce\' AND test_id=1'
            );            
        });
    });
    
});