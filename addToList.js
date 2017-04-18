module.exports = function(string, objectList){
  //if string does not exist in the object list
  if(!objectList[string]){
    //add string to object list with a value of 1 since it is the first time
    objectList[string] = 1;
    return "String was added to the object list."
  } else {
    //otherwise increment the value
    objectList[string]++;
    return "String exists, so the value was incremented."
  };
};
