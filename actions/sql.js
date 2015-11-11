//var pg = require('pg');
var q = require('q');
var options = {
    promiseLib: q
};
var pgp = require('pg-promise')(options);

var connectionObject = {
  host: process.env.OPENSHIFT_POSTGRESQL_DB_HOST,
  port: process.env.OPENSHIFT_POSTGRESQL_DB_PORT,
  database: 'recipedb',
  user: process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME,
  password: process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD
};

var db = pgp(connectionObject); //New Hotness.

/*
//var openshift_DB_host = process.env.OPENSHIFT_POSTGRESQL_DB_HOST;
//var openshift_DB_port = process.env.OPENSHIFT_POSTGRESQL_DB_PORT;
//var openshift_DB_user = process.env.OPENSHIFT_POSTGRESQL_DB_USERNAME;
//var openshift_DB_pass = process.env.OPENSHIFT_POSTGRESQL_DB_PASSWORD;
//var openshift_DB_name = process.env.PGDATABASE;
//var openshift_DB_url  = process.env.OPENSHIFT_POSTGRESQL_DB_URL;
//Old implmentation
  function databaseConnect( query, andAnotherThing ){
    var connString = "postgresql://" + openshift_DB_user + ":" + openshift_DB_pass + "@" + openshift_DB_host + ":" + openshift_DB_port + "/recipedb";
    pg.connect(connString, function(err, client, done){
      var errorHandler = function(isAnError,obj){
        if (isAnError){
          console.log("SQL Error:",isAnError);
          if (obj){
            console.log(obj);
          };
          if (client){
            done(client);
          }
          if (andAnotherThing){
            andAnotherThing(err); //Just return the error,
          return true;
          }
        }
        else{
          return false; //were all good.
        }
      }
      if(errorHandler(err, {"message":"Had trouble connecting."})){return;}
      return client.query(query,function(err,result){
        if (errorHandler(err,{"message":"There was a problem with the query.", "query":query} )){
          andAnotherThing(err, null); // return the error on an error.
        }
        else{
          done(client);
          andAnotherThing(null, result); //All is good, no error found, move out.
        }
      }); // end of client query.
    });//the last of the connect scope.
  };//
*/
//promised

exports.search = {
  name: 'search',
  description: 'I will return an object of results from a database query.',

  inputs:{
    q:{required:false}
  },

  outputExample:{
    "results":"query"
  },

  run: function(api, connection, next){

    var query = "SELECT * FROM recipes";
    db.query(query)
      .then(function(data){
        connection.response = data;
        next();
      })
      .catch(function(error){
        connection.response.error = error;
        next();
      });

    /*
    databaseConnect(query, function(err, output){
      if (output){
        connection.response.query = query;
        connection.response.rows = output.rows;
      }
      next();
    });
    */
  }

};
//promised
exports.getListOfRecipes = {
  name:"getListOfRecipes",
  description: "I return the full list of all recipes without ingredients and directions.",
  inputs: {},
  run: function(api,connection,next){

    db.query("SELECT * FROM recipes")
      .then(function(data){
        connection.response = data;
      })
      .catch(function(error){
        connection.response.error = error;
      });

    /*
    databaseConnect("SELECT * FROM recipes", function(err,recipes){
      if (err){
        connection.response.error = err;
        next();
      }
      else{
        connection.response = recipes.rows;
        next();
      }
    }); // end of first database connection
    */
  }
}
//promised:
exports.getListOfIngredientsForRecipe = {
  name:"getListOfIngredientsForRecipe",
  description: "I return the list of ingredients for a given recipe id.",
  inputs: {
    id: {required:true}
  },
  run: function(api,connection,next){
    var recipe_id = connection.params.id;

    var query = "SELECT * FROM ingredients AS ing, recipeingredientlist AS list WHERE ing.id = list.ingredient_id AND list.recipe_id= "+recipe_id;

    db.query(query)
      .then(function(data){
        connection.response = data;
        next();
      })
      .catch(function(error){
        connection.response.error = error;
        next();
      });
    /*
    databaseConnect(query, function(err,result){
      if (err){
        connection.response.error = err;
        next();
      }
      else{
        connection.response = result.rows;
        next();
      }
    });
    */
  }
}
//promised:
exports.getListOfDirectionsForRecipe = {
  name:"getListOfDirectionsForRecipe",
  description:"I return the list of directions for a given recipe id.",
  inputs: {
    id: {required:true}
  },
  run: function(api,connection,next){

    var recipe_id = connection.params.id;
    var query = "SELECT * FROM recipedirectionslist WHERE recipe_id=" + recipe_id + " ORDER BY steporder";
    /*databaseConnect(query, function(err,result){
      if (err){
        connection.response.error = err;
        next();
      }
      else{
        connection.response = result.rows;
        next();
      }
    });
    */
    db.query(query)
      .then(function(data){
        connection.response = data;
        next();
      })
      .catch(function(error){
        connection.response.error = error;
        next(new Error("There was an error."));
      });
  }
}
//promised:
exports.findIngredientIdFromName = {
  name:"findIngredientIDFromName",
  description: "I search the ingredients table and see if an ingredients exists or if one is similar, and if one of these thing is, I return its id and name.",
  inputs:{
    name:{required:false},
    n:{required:false}
  },
  run: function(api,connection,next){
    if (connection.params.name){
      var searchName = connection.params.name;
      searchName = "'%"+searchName+"%'"; //format query;
      var query = "SELECT id, name FROM ingredients WHERE UPPER(name) LIKE " + searchName.toUpperCase();
    }
    else{
      var searchName2 = connection.params.n;
      searchName2 = "'"+searchName2+"'";
      var query = "SELECT id, name FROM ingredients WHERE UPPER(name) LIKE " + searchName2.toUpperCase();
    }
    db.query(query)
      .then(function(data){
        connection.response = data;
        next();
      })
      .catch(function(error){
        connection.response.error = error;
        next();
      });
  }
}

exports.listAllIngredients = {
  name:"listAllIngredients",
  description:"I return the current contents of the Ingredients database.",
  inputs:{},
  run: function(api, connection, next){
    db.query("SELECT * FROM ingredients")
      .then(function(data){
        connection.response = data;
        next();
      })
      .catch(function(error){
        connection.response.error = error;
        next( new Error(error));
      });
  }
}

exports.listRecipeIngredients = {
  name:"listRecipeIngredients",
  description: "I return the list of ingredients and their respective data",
  inputs:{
    id:{required:true}
  },
  run: function(api, connection, next){
    var query = "SELECT list.id, list.recipe_id, list.quantity, list.unit, ing.name, list.note FROM ingredients AS ing, recipeingredientlist AS list WHERE list.recipe_id = ${recipe_id} AND list.ingredient_id = ing.id";
    var values = {"recipe_id":connection.params.id};
    db.query(query,values).then(function(data){
      connection.response = data;
      next();
    }).catch(function(error){
      var message = "Had trouble finding the list of ingredients associated with the recipe id: " + connection.params.id;
      connection.response.error = {
        "message": message,
        "evidence": error
      };
      next(new Error(message));
    });
  }
}

exports.addIngredientToDB = {
  name:"addIngredientToDB",
  description: "I add a named ingredient to its database table and return the id:name pair that is returned.",
  inputs:{
    name:{required:true}
  },
  run: function(api, connection, next){
    //var newIngName = connection.params.name;
    //var insertNewIngredient = "INSERT INTO ingredients (name) VALUES('" + newIngName +"')";
    //doesIngredintExist  = "SELECT id, name FROM ingredients WHERE UPPER(name) LIKE " + newIngName.toUpperCase();

    var searchName = connection.params.name;
    var formattedName = "'"+searchName+"'"; //format query;

    var doesIngredientExist = "SELECT id, name FROM ingredients WHERE UPPER(name) LIKE " + formattedName.toUpperCase();
    var insertNewIngredient = "INSERT INTO ingredients (name) VALUES('" + searchName + "')";

    db.query(doesIngredientExist).then(
      function(data){
        return {
          "rows":data,
          "length": data.length
        };
      }
    ).then(function(data){
      if (data.length !== 0){
        var message = "There is already an ingredient with the name: " + searchName + " in the database 'ingredients'."
        connection.response.error = {
          "message": message,
          "evidence": data.rows,
        }
        next( new Error(message) );
      }
      else{ // it is safe to add this ingredient
        db.query(insertNewIngredient).then(function(data){
          db.query(doesIngredientExist).then(function(data){
            var message = "Successfuly added ingredient with the name: " + searchName;
            connection.response = {
              "message": message,
              "evidence": data
            }
            next();
          }).catch(function(error){
            var message = "Had trouble verifying that the ingredient with the name: " + searchName + " was added.";
            connection.response.error = {
              "message": message,
              "evidence": error
            }
            next( new Error(message));
          });
        }).catch(function(error){
          var message = "Had trouble inserting the ingredient with the name: " + searchName + " to the database.";
          connection.response.error = {
            "message": message,
            "evidence": error
          }
          next( new Error(message));
        });
      }
    }).catch(function(error){
      var message = "Had trouble checking for a duplicate ingredient with the name: " + searchName;
      connection.response.error = {
        "message": message,
        "evidence": error
      };
      next( new Error(message));
    });

    // db.query(doesIngredientExist)
    //   .then(function(data){
    //     connection.response.data = data;
    //     if(data.length = 0){ //if no result is returned, then we know it is unique.
    //       db.query(insertNewIngredient)
    //         .then(function(result){
    //           connection.response = result;
    //           next();
    //         })
    //         .catch(function(error){
    //           connection.response.error = error;
    //           next( new Error(error) );
    //         });
    //     }
    //     else{
    //       connection.response.error = {
    //         "message":"There is already an ingredient by that name in the database.",
    //         "query":searchName,
    //         "proof":data
    //       }
    //       next()
    //     }
    //   })
    //   .catch(function(error){
    //     connection.response.error = error;
    //     next( new Error(error));
    //   });
  }
}

exports.addIngredientToRecipe = {
  //http://blackoak-fogwoods.rhcloud.com/api/addIngredientToRecipe?recipeid=1&name=Garlic%20Salt&qty=1/4&unit=Teaspoon&note=Use%20sparingly,%20a%20little%20goes%20a%20long%20way.
  name:"addIngredientToRecipe",
  description: "I add an Ingredient to a recipe selected by the id.",
  inputs:{
    recipeid: {required:true},
    name:     {required:true},
    qty:      {required:true},
    ing_id:   {required:false},
    unit:     {required:false},
    note:     {required:false}
  },
  run: function(api,connection,next){
    var recipe_id     = connection.params.recipeid;
    var ing_quantity  = connection.params.qty;
    var ing_unit      = connection.params.unit || null;
    var param_ing_id  = connection.params.ing_id;
    var ing_note      = connection.params.note || null;
    var insertQuery   = "INSERT INTO recipeingredientlist (recipe_id, ingredient_id, quantity, unit, note) VALUES( ${recipe_id}, ${ing_id}, ${ing_quantity}, ${ing_unit}, ${ing_note})";

    var searchName2 = connection.params.name;
    //searchName2 = "'"+searchName2+"'";
    var getIngredientIdQuery = "SELECT id, name FROM ingredients WHERE UPPER(name) LIKE '${ing_name}'";// + searchName2.toUpperCase();

    if (param_ing_id === undefined){
      //db.one(getIngredientIdQuery, { "ingredient_name":ing_name_upper }).then(function(data){
      db.query(getIngredientIdQuery,{"ing_name" : searchName2.toUpperCase()}).then(function(data){
        var ing_id = data[0].id;
        var values = {
          "recipe_id":recipe_id,
          "ing_id": ing_id,
          "ing_quantity": ing_quantity,
          "ing_unit": ing_unit,
          "ing_note": ing_note
        };
        console.log("ing_name", searchName2);
        db.none(insertQuery,values).then(function(data){
          var message = "Successfuly added a new ingredient to the list associated with recipe_id: " +recipe_id;
          connection.response = message;
          next();
        }).catch(function(error){
          var message = "Had trouble adding a new ingredient to the list associated with recipe_id: " + recipe_id;
          connection.response.error = {
            "message": message,
            "evidence": error
          };
          next(new Error(message));
        });
      }).catch( function(error){
        var message = "Had trouble finding the id of the ingredient named " + ing_name;
        connection.response.error = {
          "message": message,
          "query":getIngredientIdQuery,
          "evidence": error
        };
        next(new Error(message));
      });
    }
    else{
      var values = {
        "recipe_id":recipe_id,
        "ing_id": param_ing_id, //here, we are using the defined value
        "ing_quantity": ing_quantity,
        "ing_unit": ing_unit,
        "ing_note": ing_note
      };
      db.none(insertQuery, values).then(function(data){
        var message = "Successfuly added a new ingredient to the list associated with recipe_id: " +recipe_id;
        connection.response = message;
        next();
      }).catch(function(error){
        var message = "Had trouble adding a new ingredient to the list associated with recipe_id: " + recipe_id;
        connection.response.error = {
          "message": message,
          "evidence": error
        };
        next(new Error(message));
      });
    }
  }
}
