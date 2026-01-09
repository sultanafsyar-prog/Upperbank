/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // add field
  collection.fields.addAt(15, new Field({
    "hidden": false,
    "id": "select2671376561",
    "maxSelect": 1,
    "name": "station",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "cutting 1",
      "cutting 2",
      "cutting 3"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // remove field
  collection.fields.removeById("select2671376561")

  return app.save(collection)
})
