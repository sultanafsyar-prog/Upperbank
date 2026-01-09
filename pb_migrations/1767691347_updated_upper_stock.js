/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2178506470")

  // remove field
  collection.fields.removeById("number1475513172")

  // add field
  collection.fields.addAt(9, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text4156564586",
    "max": 0,
    "min": 0,
    "name": "size",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2178506470")

  // add field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "number1475513172",
    "max": null,
    "min": null,
    "name": "size",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // remove field
  collection.fields.removeById("text4156564586")

  return app.save(collection)
})
