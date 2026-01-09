/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number1724343031",
    "max": null,
    "min": null,
    "name": "qty_out",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(16, new Field({
    "hidden": false,
    "id": "number2344237674",
    "max": null,
    "min": null,
    "name": "qty_sisa",
    "onlyInt": false,
    "presentable": true,
    "required": false,
    "system": false,
    "type": "number"
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_3307771590")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "number1724343031",
    "max": null,
    "min": null,
    "name": "qty_out",
    "onlyInt": true,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(16, new Field({
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
})
