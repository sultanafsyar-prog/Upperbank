/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // add field
  collection.fields.addAt(19, new Field({
    "hidden": false,
    "id": "number2344237674",
    "max": null,
    "min": null,
    "name": "qty_sisa",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // remove field
  collection.fields.removeById("number2344237674")

  return app.save(collection)
})
