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
    
    describe('insert', function() {
        it('should build basic insert without ending', function() {
            assert.equal(
                sql.insert('test_id,name').into('tbl_test').entry().returning('test_id').build(),
                'INSERT INTO tbl_test(test_id,name) VALUES ($1,$2) RETURNING test_id'
            );            
        });
    });

    describe('update', function() {
        it('should build basic update without ending', function() {
            assert.equal(
                sql.update('tbl_test').set(['name=\'test\'', 'ts=\'2016-01-01\'']).returning('test_id').build(),
                'UPDATE tbl_test SET name=\'test\',ts=\'2016-01-01\' RETURNING test_id'
            );            
        });
    });

    describe('delete', function() {
        it('should build basic delete without ending', function() {
            assert.equal(
                sql.delete().from('tbl_test').returning('test_id').build(),
                'DELETE FROM tbl_test RETURNING test_id'
            );            
        });
    });
    
});