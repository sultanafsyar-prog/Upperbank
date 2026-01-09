/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2178506470")

  // remove field
  collection.fields.removeById("date2990389176")

  // add field
  collection.fields.addAt(10, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text689281445",
    "max": 0,
    "min": 0,
    "name": "waktu_input",
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
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "date2990389176",
    "max": "",
    "min": "",
    "name": "created",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // remove field
  collection.fields.removeById("text689281445")

  return app.save(collection)
})
