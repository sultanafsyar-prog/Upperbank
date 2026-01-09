/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // add field
  collection.fields.addAt(12, new Field({
    "autogeneratePattern": "",
    "hidden": false,
    "id": "text1624678591",
    "max": 0,
    "min": 0,
    "name": "verified_by",
    "pattern": "",
    "presentable": false,
    "primaryKey": false,
    "required": false,
    "system": false,
    "type": "text"
  }))

  // add field
  collection.fields.addAt(13, new Field({
    "hidden": false,
    "id": "select250649779",
    "maxSelect": 1,
    "name": "check_status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "WAITING",
      "VERIFIED"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // remove field
  collection.fields.removeById("text1624678591")

  // remove field
  collection.fields.removeById("select250649779")

  return app.save(collection)
})
