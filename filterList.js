//function accepts 2 args:
//function filters through the object and returns an array based on the
//string input
module.exports = function(object, string){
  var filteredList = [];
  for(var key in object){
    if(string === "ALL"){
      filteredList.push(key);
    } else if(key.startsWith(string)){
      filteredList.push(key);
    };
  };
  return filteredList;
};
