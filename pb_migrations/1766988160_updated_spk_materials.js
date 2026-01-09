/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // add field
  collection.fields.addAt(20, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2485137520",
    "max": 0,
    "min": 0,
    "name": "rak_awal",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(21, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text2106514048",
    "max": 0,
    "min": 0,
    "name": "rak_saat_ini",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(22, new Field({
    "hidden": false,
    "id": "json3303030831",
    "maxSize": 0,
    "name": "take_history",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "json"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // remove field
  collection.fields.removeById("text2485137520")

  // remove field
  collection.fields.removeById("text2106514048")

  // remove field
  collection.fields.removeById("json3303030831")

  return app.save(collection)
})
