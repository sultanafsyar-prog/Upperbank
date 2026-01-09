/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
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

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(2, new Field({
    "hidden": false,
    "id": "date1480777589",
    "max": "",
    "min": "",
    "name": "date_in",
    "presentable": false,
    "required": true,
    "system": false,
    "type": "date"
  }))

  return app.save(collection)
})
