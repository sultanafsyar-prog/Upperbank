/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // remove field
  collection.fields.removeById("date1480777589")

  // remove field
  collection.fields.removeById("date149301996")

  // remove field
  collection.fields.removeById("text1587448267")

  // remove field
  collection.fields.removeById("text3432813396")

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // add field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date1480777589",
    "max": "",
    "min": "",
    "name": "date_in",
    "presentable": true,
    "required": true,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "date149301996",
    "max": "",
    "min": "",
    "name": "date_out",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // add field
  collection.fields.addAt(8, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1587448267",
    "max": 0,
    "min": 0,
    "name": "line",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text3432813396",
    "max": 0,
    "min": 0,
    "name": "take_line",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  return app.save(collection)
})
