/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // add field
  collection.fields.addAt(9, new Field({
    "hidden": false,
    "id": "number4135912883",
    "max": null,
    "min": null,
    "name": "urutan_kerja",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(10, new Field({
    "hidden": false,
    "id": "number3328281011",
    "max": null,
    "min": null,
    "name": "qty_target",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // add field
  collection.fields.addAt(11, new Field({
    "hidden": false,
    "id": "number2725461099",
    "max": null,
    "min": null,
    "name": "qty_actual",
    "onlyInt": false,
    "presentable": false,
    "required": false,
    "system": false,
    "type": "number"
  }))

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date1610411124",
    "max": "",
    "min": "",
    "name": "xfd_date",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select1655102503",
    "maxSelect": 1,
    "name": "status",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "WAITING",
      "IN-PROGRESS"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_867860984")

  // remove field
  collection.fields.removeById("number4135912883")

  // remove field
  collection.fields.removeById("number3328281011")

  // remove field
  collection.fields.removeById("number2725461099")

  // update field
  collection.fields.addAt(7, new Field({
    "hidden": false,
    "id": "date1610411124",
    "max": "",
    "min": "",
    "name": "xfd_target",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "date"
  }))

  // update field
  collection.fields.addAt(8, new Field({
    "hidden": false,
    "id": "select1655102503",
    "maxSelect": 1,
    "name": "priority",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "Normal",
      "Urgent",
      "Top Priority"
    ]
  }))

  return app.save(collection)
})
